<template>
  <v-card :disabled="!connected" :loading="loading" class="mb-4">
    <v-card-title>{{ scheduleEntry.hours | formatHours }}:{{ scheduleEntry.minutes | formatNumber }}</v-card-title>
    <v-card-subtitle>Local time (GMT {{ -timezoneOffset >= 0 ? '+' : '-' }}{{ -timezoneOffset }})</v-card-subtitle>
    <v-card-text class="pb-0 pt-0">
      <v-container class="pa-0">
        <v-row>
          <v-col>
            <v-select
              label="Portions (1 = 10 gram)"
              :error="portionsErrorMessage !== ''"
              :error-messages="portionsErrorMessage"
              :items="portions"
              v-model="scheduleEntry.portions"
            />
          </v-col>
          <v-col>
            <v-switch
              v-model="scheduleEntry.enabled"
              :label="scheduleEntry.enabled ? 'Enabled' : 'Disabled'"
              :error="enabledErrorMessage !== ''"
              :error-messages="enabledErrorMessage"
            ></v-switch>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              label="Hour (UTC)"
              :error="hoursErrorMessage !== ''"
              :error-messages="hoursErrorMessage"
              :items="hours"
              v-model="scheduleEntry.hours"
            />
          </v-col>
          <v-col>
            <v-select
              label="Minutes"
              :error="minutesErrorMessage !== ''"
              :error-messages="minutesErrorMessage"
              :items="minutes"
              v-model="scheduleEntry.minutes"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { nf } from '../utilities/helpers'

export default {
  props: {
    scheduleEntry: Object,
  },
  data: () => ({
    loading: false,
    timezoneOffset: new Date().getTimezoneOffset() / 60, // getTimezoneOffset() in minutes, for example -60 / 60 = -1 in hours
    hours: Array.from(Array(24).keys()).map(val => {
      return { text: nf(val), value: val } // 0 - 23
    }),
    minutes: Array.from(Array(60).keys()).map(val => {
      return { text: nf(val), value: val } // 0 - 59
    }),
    portions: Array.from(Array(10).keys()).map(val => {
      return { text: val + 1, value: val + 1 } // 1 - 10
    }),
    minutesErrorMessage: '',
    hoursErrorMessage: '',
    portionsErrorMessage: '',
    enabledErrorMessage: '',
    updatingFromWatcher: false, // VERY ugly solution https://github.com/vuejs/vue/issues/1829
  }),
  computed: mapState(['connected']),
  watch: {
    'scheduleEntry.portions': {
      handler: function(newVal, oldVal) {
        this.updateChanges('portions', newVal, oldVal)
      },
    },
    'scheduleEntry.enabled': {
      handler: function(newVal, oldVal) {
        this.updateChanges('enabled', newVal, oldVal)
      },
    },
    'scheduleEntry.minutes': {
      handler: function(newVal, oldVal) {
        this.updateChanges('minutes', newVal, oldVal)
      },
    },
    'scheduleEntry.hours': {
      handler: function(newVal, oldVal) {
        this.updateChanges('hours', newVal, oldVal)
      },
    },
  },
  methods: {
    ...mapActions(['showSnackbar']),
    addPortion() {
      this.scheduleEntry.portions < 10 && this.scheduleEntry.portions++
    },
    removePortion() {
      this.scheduleEntry.portions > 1 && this.scheduleEntry.portions--
    },
    addHour() {
      if (this.scheduleEntry.hours < 23) this.scheduleEntry.hours++
      else this.scheduleEntry.hours = 0
    },
    removeHour() {
      if (this.scheduleEntry.hours >= 1) this.scheduleEntry.hours--
      else this.scheduleEntry.hours = 23
    },
    updateChanges(changedField, newVal, oldVal) {
      if (this.updatingFromWatcher) {
        this.updatingFromWatcher = false
        return
      }

      this.loading = true
      this.$store
        .dispatch('setScheduleEntry', this.scheduleEntry)
        .then(() => {
          // resetting error message
          this[`${changedField}ErrorMessage`] = '' // for example data object: { portionsErrorMessage = '' }
        })
        .catch(err => {
          this.updatingFromWatcher = true
          this.scheduleEntry[changedField] = oldVal // rolling back changes
          this[`${changedField}ErrorMessage`] = err // setting error message
          console.error('setScheduleEntry error:', err)
          this.$store.dispatch('showSnackbar', {
            text: err,
            timeout: 10000,
          })
        })
        .then(() => {
          this.loading = false
        })
    },
  },
  filters: {
    formatNumber: nf,
    formatHours: function(h) {
      const timezoneOffset = new Date().getTimezoneOffset() / 60 // getTimezoneOffset() in minutes, for example -60 / 60 = -1 in hours
      let localHour = h - timezoneOffset
      localHour = localHour === 24 ? 0 : localHour
      return nf(localHour)
    },
  },
}
</script>

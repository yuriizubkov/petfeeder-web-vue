<template>
  <v-card class="mb-4">
    <v-card-title>{{schedule.hours | formatHours}}:{{schedule.minutes | formatNumber}}</v-card-title>
    <v-card-subtitle>Local time (GMT {{-timezoneOffset>=0 ? '+' : '-'}}{{-timezoneOffset}})</v-card-subtitle>
    <v-card-text class="pb-0 pt-0">
      <v-container class="pa-0">
        <v-row>
          <v-col>
            <v-select
              label="Portions (1 = 10 gram)"
              :error="portionsErrorMessage !== ''"
              :error-messages="portionsErrorMessage"
              :items="portions"
              v-model="schedule.portions"
            />
          </v-col>
          <v-col>
            <v-switch
              v-model="schedule.enabled"
              :label="schedule.enabled ? 'Enabled' : 'Disabled'"
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
              v-model="schedule.hours"
            />
          </v-col>
          <v-col>
            <v-select
              label="Minutes"
              :error="minutesErrorMessage !== ''"
              :error-messages="minutesErrorMessage"
              :items="minutes"
              v-model="schedule.minutes"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    scheduleEntry: Object,
  },
  data: function() {
    return {
      timezoneOffset: new Date().getTimezoneOffset() / 60, // getTimezoneOffset() in minutes, for example -60 / 60 = -1 in hours
      hours: Array.from(Array(24).keys()).map(val => {
        return { text: ('0' + val).slice(-2), value: val } // 0 - 23
      }),
      minutes: Array.from(Array(60).keys()).map(val => {
        return { text: ('0' + val).slice(-2), value: val } // 0 - 59
      }),
      portions: Array.from(Array(10).keys()).map(val => {
        return { text: val + 1, value: val + 1 } // 1 - 10
      }),
      minutesErrorMessage: '',
      hoursErrorMessage: '',
      portionsErrorMessage: '',
      enabledErrorMessage: '',
      updatingFromWatcher: false, // VERY ugly solution https://github.com/vuejs/vue/issues/1829
      schedule: this.scheduleEntry,
    }
  },
  watch: {
    'schedule.portions': {
      handler: function(newVal, oldVal) {
        this.updateChanges('portions', newVal, oldVal)
      },
    },
    'schedule.enabled': {
      handler: function(newVal, oldVal) {
        this.updateChanges('enabled', newVal, oldVal)
      },
    },
    'schedule.minutes': {
      handler: function(newVal, oldVal) {
        this.updateChanges('minutes', newVal, oldVal)
      },
    },
    'schedule.hours': {
      handler: function(newVal, oldVal) {
        this.updateChanges('hours', newVal, oldVal)
      },
    },
  },
  methods: {
    addPortion() {
      this.schedule.portions < 10 && this.schedule.portions++
    },
    removePortion() {
      this.schedule.portions > 1 && this.schedule.portions--
    },
    addHour() {
      if (this.schedule.hours < 23) this.schedule.hours++
      else this.schedule.hours = 0
    },
    removeHour() {
      if (this.schedule.hours >= 1) this.schedule.hours--
      else this.schedule.hours = 23
    },
    updateChanges(changedField, newVal, oldVal) {
      if (this.updatingFromWatcher) {
        this.updatingFromWatcher = false
        return
      }

      this.$store
        .dispatch('setScheduleEntry', this.schedule)
        .then(() => {
          // resetting error message
          this[`${changedField}ErrorMessage`] = '' // for example data object: { portionsErrorMessage = '' }
        })
        .catch(err => {
          this.updatingFromWatcher = true
          this.schedule[changedField] = oldVal // rolling back changes
          this[`${changedField}ErrorMessage`] = err // setting error message
          console.error('setScheduleEntry error:', err)
        })
    },
  },
  filters: {
    formatNumber: function(number) {
      return ('0' + number).slice(-2)
    },
    formatHours: function(h) {
      const timezoneOffset = new Date().getTimezoneOffset() / 60 // getTimezoneOffset() in minutes, for example -60 / 60 = -1 in hours
      let localHour = h - timezoneOffset
      localHour = localHour === 24 ? 0 : localHour
      return ('0' + localHour).slice(-2)
    },
  },
}
</script>

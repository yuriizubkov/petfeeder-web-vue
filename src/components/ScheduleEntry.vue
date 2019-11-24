<template>
  <v-card class="mb-4">
    <v-card-title>Schedule entry #{{schedule.entryIndex}}</v-card-title>
    <v-card-subtitle>{{formatHours(schedule.hours)}}:{{formatNumber(schedule.minutes)}}</v-card-subtitle>
    <v-card-text>
      Portions:
      <v-text-field
        :error="portionsErrorMessage !== ''"
        :error-messages="portionsErrorMessage"
        v-model="schedule.portions"
        readonly
        single-line
        type="number"
      >
        <v-icon @click="addPortion()" slot="append">mdi-plus</v-icon>
        <v-icon @click="removePortion()" slot="prepend">mdi-minus</v-icon>
      </v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-switch
        class="pl-2"
        v-model="schedule.enabled"
        :label="schedule.enabled ? 'Enabled' : 'Disabled'"
        :error="enabledErrorMessage !== ''"
        :error-messages="enabledErrorMessage"
      ></v-switch>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    scheduleEntry: Object,
  },
  data: function() {
    return {
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
  },
  methods: {
    formatNumber(number) {
      return ('0' + number).slice(-2)
    },
    formatHours(h) {
      const timezoneOffset = new Date().getTimezoneOffset() / 60 // getTimezoneOffset() in minutes, for example -60 / 60 = -1 in hours
      return this.formatNumber(h - timezoneOffset)
    },
    addPortion() {
      this.schedule.portions < 10 && this.schedule.portions++
    },
    removePortion() {
      this.schedule.portions > 1 && this.schedule.portions--
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
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title>Schedule entry #{{schedule.entryIndex}}</v-card-title>
    <v-card-subtitle>{{formatTime(schedule.hours)}}:{{formatTime(schedule.minutes)}} UTC</v-card-subtitle>
    <v-card-text>
      Portions:
      <v-text-field v-model="schedule.portions" readonly hide-details single-line type="number">
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
      enabledErrorMessage: '',
      updatingFromWatcher: false, // VERY ugly solution https://github.com/vuejs/vue/issues/1829
      schedule: this.scheduleEntry,
    }
  },
  watch: {
    'schedule.enabled': {
      handler: function(newVal, oldVal) {
        this.updateChanges('enabled', newVal, oldVal)
      },
    },
  },
  methods: {
    formatTime(number) {
      return ('0' + number).slice(-2)
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
          this[`${changedField}ErrorMessage`] = ''
        })
        .catch(err => {
          this.updatingFromWatcher = true
          this.schedule[changedField] = oldVal // rolling back changes
          this[`${changedField}ErrorMessage`] = err
          console.error('setScheduleEntry error:', err)
        })
    },
  },
}
</script>

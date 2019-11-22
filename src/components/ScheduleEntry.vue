<template>
  <v-card class="mb-4">
    <v-card-title>Schedule entry #{{scheduleEntry.entryIndex}}</v-card-title>
    <v-card-subtitle>{{formatTime(scheduleEntry.hours)}}:{{formatTime(scheduleEntry.minutes)}} UTC</v-card-subtitle>
    <v-card-text>
      Portions:
      <v-text-field
        v-model="scheduleEntry.portions"
        readonly
        hide-details
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
        v-model="scheduleEntry.enabled"
        :label="scheduleEntry.enabled ? 'Enabled' : 'Disabled'"
      ></v-switch>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    scheduleEntry: Object,
  },
  watch: {
    'scheduleEntry.portions': function(newVal, oldVal) {
      this.$store.dispatch('setScheduleEntry', this.scheduleEntry).catch(err => {
        this.scheduleEntry.portions = oldVal
        console.log(err)
      })
    },
    'scheduleEntry.enabled': function(newVal, oldVal) {
      this.$store.dispatch('setScheduleEntry', this.scheduleEntry).catch(err => {
        this.scheduleEntry.enabled = oldVal
        console.log(err)
      })
    },
  },
  methods: {
    formatTime(number) {
      return ('0' + number).slice(-2)
    },
    addPortion() {
      this.scheduleEntry.portions < 10 && this.scheduleEntry.portions++
    },
    removePortion() {
      this.scheduleEntry.portions > 1 && this.scheduleEntry.portions--
    },
  },
}
</script>

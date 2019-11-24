<template>
  <v-container fluid>
    <v-row v-if="schedule && schedule.length === 0" align="center" justify="center">
      <v-col cols="1">
        <v-progress-circular :size="70" :width="7" color="purple" indeterminate />
      </v-col>
    </v-row>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="8">
        <ScheduleEntry
          :scheduleEntry="scheduleEntry"
          :key="scheduleEntry.entryIndex"
          v-for="scheduleEntry of schedule"
        ></ScheduleEntry>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import ScheduleEntry from '../components/ScheduleEntry'
export default {
  components: {
    ScheduleEntry,
  },
  computed: mapState(['schedule']),
  created: function() {
    this.$store.dispatch('getSchedule')
  },
}
</script>
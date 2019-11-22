<template>
  <v-container class="fill-height" fluid>
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
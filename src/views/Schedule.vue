<template>
  <v-container fluid>
    <v-row v-if="loading" align="center" justify="center">
      <v-col cols="6" class="text-center">
        <v-progress-circular :size="70" :width="7" indeterminate />
      </v-col>
    </v-row>
    <v-row v-else align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
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
import { mapState, mapActions } from 'vuex'
import ScheduleEntry from '../components/ScheduleEntry'
export default {
  data: () => ({
    loading: true,
  }),
  components: {
    ScheduleEntry,
  },
  computed: mapState(['schedule', 'loadingSchedule', 'setSchedule']),
  methods: mapActions(['showSnackbar']),
  created: async function() {
    try {
      this.$store.commit('setSchedule', [])
      await this.$store.dispatch('getSchedule')
    } catch (err) {
      console.error('getSchedule error:', err)
      this.$store.dispatch('showSnackbar', {
        text: err,
        timeout: 10000,
      })
    }

    this.loading = false
  },
}
</script>
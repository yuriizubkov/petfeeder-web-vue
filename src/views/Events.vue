<template>
  <v-container fluid>
    <v-row v-if="loading" align="center" justify="center">
      <v-col cols="6" class="text-center">
        <v-progress-circular :size="70" :width="7" indeterminate />
      </v-col>
    </v-row>
    <v-row v-else align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
        <v-list dense v-if="eventList && eventList.length > 0" subheader>
          <v-list-item v-for="(item, index) in eventList" :key="index">
            <v-list-item-avatar>
              <v-icon v-text="getIconClass(item)"></v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-text="getFriendlyType(item)"></v-list-item-title>
              <v-list-item-subtitle v-text="getDateString(item)"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <div
          class="text-center"
          v-if="!loading && (!eventList || eventList.length === 0)"
        >So quiet here...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
export default {
  data: () => ({
    loading: true,
  }),
  computed: mapState(['eventList']),
  methods: {
    ...mapMutations(['setEvents']),
    ...mapActions(['showSnackbar']),
    getIconClass(item) {
      let cssClass
      switch (item.type) {
        case 'feeding':
          cssClass = 'mdi-food'
          break
        case 'clocksync':
          cssClass = 'mdi-clock'
          break
        case 'warning':
          cssClass = 'mdi-alert'
          break
      }

      return cssClass
    },
    getFriendlyType(item) {
      let friendlyType = item.type
      switch (item.type) {
        case 'feeding':
          friendlyType = `Feeding. Issued portions: ${item.data.issuedPortions}, scheduled: ${
            item.data.scheduled ? 'Yes' : 'No'
          }${item.data.issuedPortions < item.data.scheduledPortions ? '. Motor stuck!' : ''}`
          break
        case 'clocksync':
          friendlyType = 'Clock synchronization'
          break
        case 'warning':
          switch (item.data.type) {
            case 'nofood':
              friendlyType = 'Warning. No food left!'
              break
            default:
              friendlyType = JSON.stringify(item)
              break
          }
          break
        default:
          friendlyType = JSON.stringify(item)
          break
      }

      return friendlyType
    },
    getDateString(item) {
      const pad = function(number) {
        return ('0' + number).slice(-2)
      }
      const date = new Date(item.timestamp)
      return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(
        date.getMinutes()
      )}:${pad(date.getSeconds())}`
    },
  },
  created: async function() {
    try {
      this.$store.commit('setEvents', [])
      await this.$store.dispatch('getEvents')
    } catch (err) {
      console.error('getEvents error:', err)
      this.$store.dispatch('showSnackbar', {
        text: err,
        timeout: 10000,
      })
    }

    this.loading = false
  },
}
</script>
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="8">
        <v-list subheader v-if="eventList">
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
export default {
  computed: mapState(['eventList', 'rpcRequestInProgress']),
  methods: {
    getIconClass(item) {
      let cssClass
      switch (item.type) {
        case 'feeding':
          cssClass = 'mdi-food'
          break
        case 'clocksync':
          cssClass = 'mdi-clock'
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
  created: function() {
    this.$store.dispatch('getEvents')
  },
}
</script>
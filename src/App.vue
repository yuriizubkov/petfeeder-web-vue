<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item link to="/">
          <v-list-item-action>
            <v-icon>mdi-home</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/schedule">
          <v-list-item-action>
            <v-icon>mdi-calendar-clock</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Schedule</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/events">
          <v-list-item-action>
            <v-icon>mdi-timeline-alert</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Events</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/settings">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>
        <router-link tag="span" class="title-pointer" to="/">{{ title }}</router-link>
      </v-toolbar-title>
    </v-app-bar>

    <v-content>
      <router-view></router-view>
    </v-content>

    <v-footer app>
      <span :class="connectionStateCss">{{ connectionStateString }}</span>
    </v-footer>
    <v-snackbar v-model="snackbarModel.snackbar" :timeout="snackbarModel.timeout">
      {{ snackbarModel.text }}
      <v-btn text @click="snackbarModel.snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data: () => ({
    drawer: null,
    snackbarModel: {
      snackbar: false,
      text: '',
      timeout: 3000,
    },
  }),
  watch: {
    snackbar: function(newVal) {
      this.snackbarModel = newVal
    },
  },
  computed: {
    ...mapState(['connectionStateString', 'connected', 'snackbar', 'title']),
    connectionStateCss: function() {
      return this.connected ? 'success--text' : 'error--text'
    },
  },
  created() {
    this.$vuetify.theme.dark = true
  },
}
</script>

<style scoped>
.title-pointer {
  cursor: pointer;
}
</style>

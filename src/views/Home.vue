<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="8">
        <v-card>
          <!--https://pixabay.com/vectors/dog-cat-animal-pet-cute-1517090/-->
          <v-img contain src="../assets/camera_back.png" height="480" aspect-ratio="1.33"></v-img>
          <v-card-actions>
            <v-btn :disabled="rpcRequestInProgress || !connected" :loading="rpcRequestInProgress" @click="startVideo"
              >Start Video</v-btn
            >
            <v-btn :disabled="rpcRequestInProgress || !connected" :loading="rpcRequestInProgress" @click="feed"
              >Feed 1 portion</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  computed: mapState(['rpcRequestInProgress', 'connected']),
  methods: {
    ...mapActions(['showSnackbar']),
    async startVideo() {
      try {
        await this.$store.dispatch('startVideo')
      } catch (err) {
        console.error('startVideo error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }
    },
    async feed() {
      try {
        await this.$store.dispatch('feedManually')
      } catch (err) {
        console.error('feed error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }
    },
  },
}
</script>

<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="8">
        <v-card id="videCard" ref="videoCard">
          <canvas id="videoCanvas" ref="videoCanvas"></canvas>
          <v-card-actions>
            <v-btn :disabled="rpcRequestInProgress || !connected" :loading="rpcRequestInProgress" @click="startVideo"
              >Start Video</v-btn
            >
            <v-btn :disabled="rpcRequestInProgress || !connected" :loading="rpcRequestInProgress" @click="feed"
              >Give 1 portion</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import backImageUrl from '../assets/camera_back.png'
import BroadwayPlayer from 'broadway'

const player = new BroadwayPlayer(),

export default {
  data: () => ({
    backImage: null,
    videoPlaying: false,
  }),
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
    resizeCanvas() {
      const canvas = this.$refs.videoCanvas
      const card = this.$refs.videoCard.$el

      canvas.height = card.clientWidth / 1.33 // 4/3 aspect ratio
      canvas.width = card.clientWidth
    },
    drawBackImage() {
      const canvasCtx = this.$refs.videoCanvas.getContext('2d')
      canvasCtx.drawImage(
        this.backImage, // image
        0, // source image from Y
        0, // source image from X
        this.backImage.width, // source image width
        this.backImage.height, // source image height
        0, // destination Y
        0, // destination X
        canvasCtx.canvas.width, // destination width
        canvasCtx.canvas.height // destination height
      )
    },
    onWindowResize() {
      this.resizeCanvas()
      if (!this.videoPlaying) this.drawBackImage()
    },
  },
  mounted() {
    // when mounted and elements added to DOM
    this.$nextTick(() => {
      const backImage = new Image()
      backImage.onload = () => {
        this.backImage = backImage
        this.resizeCanvas()
        this.drawBackImage()
      }

      window.addEventListener('resize', this.onWindowResize)
      backImage.src = backImageUrl // loading background image (Author: https://pixabay.com/vectors/dog-cat-animal-pet-cute-1517090/)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
  },
}
</script>

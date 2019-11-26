<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="8">
        <v-card id="videCard" ref="videoCard">
          <!-- Author of the background image: https://pixabay.com/vectors/dog-cat-animal-pet-cute-1517090/ -->
          <canvas id="videoCanvas" ref="videoCanvas"></canvas>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              :disabled="rpcRequestInProgress || !connected"
              :loading="videoBtnLoading"
              @click="videoPlaying ? stopVideo() : startVideo()"
            >{{ videoButtonCaption }}</v-btn>
            <v-btn
              :disabled="rpcRequestInProgress || !connected"
              :loading="feedBtnLoading"
              @click="feed"
            >Give 1 portion</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import backImageUrl from '../assets/camera_back.png'
import Broadway from 'broadway-player'

export default {
  canvasCtx: null,
  player: null,
  backImage: null,
  data: () => ({
    videoPlaying: false,
    videoBtnLoading: false,
    feedBtnLoading: false,
  }),
  computed: {
    ...mapState(['rpcRequestInProgress', 'connected']),
    videoButtonCaption: function() {
      return this.videoPlaying ? 'Stop video' : 'Start video'
    },
  },
  methods: {
    ...mapActions(['showSnackbar']),
    decodeVideo: function(data) {
      const nalPrefix = new Uint8Array([0, 0, 0, 1]) // Adding NAL Unit header
      const buffer = new Uint8Array(data)
      const concat = new Uint8Array(nalPrefix.length + buffer.length)
      concat.set(nalPrefix)
      concat.set(buffer, nalPrefix.length)
      this.player.decode(concat)
    },
    onDecoded(buffer, width, height) {
      // rescaling and redrawing on 2d canvas
      this.canvasCtx.drawImage(
        this.player.canvas, // image
        0, // source image from Y
        0, // source image from X
        width, // source image width
        height, // source image height
        0, // destination Y
        0, // destination X
        this.canvasCtx.canvas.width, // destination width
        this.canvasCtx.canvas.height // destination height
      )
    },
    async startVideo() {
      try {
        this.videoBtnLoading = true
        this.$store.socket.on('event/camera/h264data', this.decodeVideo)
        await this.$store.dispatch('startVideo')
        this.playerStart()
      } catch (err) {
        console.error('startVideo error:', err)
        this.$store.socket.off('event/camera/h264data', this.decodeVideo)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.videoBtnLoading = false
    },
    async stopVideo() {
      try {
        this.videoBtnLoading = true
        this.playerStop()
        this.$store.socket.off('event/camera/h264data', this.decodeVideo)
        await this.$store.dispatch('stopVideo')
      } catch (err) {
        console.error('stopVideo error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.videoBtnLoading = false
    },
    async feed() {
      try {
        this.feedBtnLoading = true
        await this.$store.dispatch('feedManually')
      } catch (err) {
        console.error('feed error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.feedBtnLoading = false
    },
    playerStart() {
      this.videoPlaying = true
      //player.canvas = this.$refs.videoCanvas
    },
    playerStop() {
      this.videoPlaying = false
      //player.canvas = null
      this.drawBackImage()
    },
    resizeCanvas() {
      const canvas = this.$refs.videoCanvas
      const card = this.$refs.videoCard.$el

      canvas.height = card.clientWidth / 1.33 // 4/3 aspect ratio
      canvas.width = card.clientWidth
    },
    drawBackImage() {
      this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height)
      this.canvasCtx.drawImage(
        this.backImage, // image
        0, // source image from Y
        0, // source image from X
        this.backImage.width, // source image width
        this.backImage.height, // source image height
        0, // destination Y
        0, // destination X
        this.canvasCtx.canvas.width, // destination width
        this.canvasCtx.canvas.height // destination height
      )
    },
    onWindowResize() {
      this.resizeCanvas()
      if (!this.videoPlaying) this.drawBackImage()
    },
  },
  created() {
    this.player = new Broadway.Player({
      size: {
        width: 640,
        height: 480,
      },
    })

    this.player.onPictureDecoded = this.onDecoded
  },
  mounted() {
    // when component mounted and elements added to the DOM
    this.$nextTick(() => {
      this.canvasCtx = this.$refs.videoCanvas.getContext('2d')
      const backImage = new Image()
      backImage.onload = () => {
        this.backImage = backImage
        this.resizeCanvas()
        this.drawBackImage()
      }

      window.addEventListener('resize', this.onWindowResize)
      backImage.src = backImageUrl // loading background image
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    this.stopVideo()
  },
}
</script>

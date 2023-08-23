<template>
  <v-app>
    <v-main class="bg-primary">
      <v-container ref="container">
        <v-row>
          <v-col>
            <v-select v-model="currentLocale" class="mb-2" label="lang" :items="locales" density="compact" hide-details variant="underlined"/>
            <v-card color="white" class="pa-4">
              <v-card-title class="text-center">🍓🍓🍓NuAeS-4000🍓🍓🍓</v-card-title>
              <v-card-subtitle class="text-center">{{ t('$vuetify.subtitle') }}</v-card-subtitle>
              <v-card-subtitle class="text-center">{{ t('$vuetify.subtitle-end') }}</v-card-subtitle>
              <v-divider class="mt-4"/>
              <v-row>
                <v-col cols="12" xl="6">
                  <v-card-text class="font-weight-bold">{{ t('$vuetify.encryption') }}</v-card-text>
                  <v-card-text v-html="t('$vuetify.encryption-steps')" />
                </v-col>
                <v-col cols="12" xl="6">
                  <v-card-text class="font-weight-bold">{{ t('$vuetify.decryption') }}</v-card-text>
                  <v-card-text v-html="t('$vuetify.decryption-steps')" />
                </v-col>
              </v-row>
              <v-card-text class="font-weight-bold" v-html="t('$vuetify.description')"/>
              <a href="https://github.com/Vladlebed/NuAeS-4000" target="_blank">
                <img width="100" src="@/assets/icons/GitHub_Logo.png" alt="">
              </a>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card color="white" class="pa-4">
              <v-text-field v-model.trim="secretString" :label="t('$vuetify.secret-word')" hide-details @update:model-value="updateSecret"/>
              <v-checkbox v-model="allowSaveSecret" color="primary" :label="t('$vuetify.save-secret-word')" hide-details @update:model-value="changeAllowSaveSecret"/>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 d-flex flex-column fill-height">
              <div class="flex-grow-1">
                <v-card-title>{{ t('$vuetify.encryption') }}</v-card-title>
                <v-file-input :label="t('$vuetify.select-media')" accept="image/png, image/jpeg, image/jpg, image/JPG, image/JPEG, video/mp4" variant="underlined" hide-details multiple class="mb-4" @update:model-value="changeItems"/>
              </div>
              <v-row>
                <v-col>
                  <v-btn width="100%" color="primary" :disabled="!items.length || !secretString" @click="encrypt">{{t('$vuetify.encrypt')}}</v-btn>
                </v-col>
                <v-col>
                  <v-btn width="100%" color="primary" :disabled="!encryptString" @click="saveResult([{ filename:'secret.txt', file: encryptString }], true)">{{t('$vuetify.download')}}</v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 fill-height">
              <v-card-title>{{t('$vuetify.decryption')}}</v-card-title>
              <v-file-input :label="t('$vuetify.select-archive')" accept=".zip" variant="underlined" hide-details @update:model-value="putArchive"/>
              <v-row>
                <v-col>
                  <v-btn width="100%" color="primary" class="mt-4" :disabled="!encryptString || !secretString" @click="decrypt">{{t('$vuetify.decrypt')}}</v-btn>
                </v-col>
                <v-col>
                  <v-btn width="100%" color="primary" class="mt-4" :disabled="!encryptString" @click="downloadItems(items)">{{t('$vuetify.download')}}</v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
        <template v-if="items.length">
          <v-row>
            <v-col class="d-flex justify-center">
              <div v-for="(column, columnIndex) in columns" :key="columnIndex">
                <v-card v-for="(item, itemIndex) in column" :key="itemIndex" class="pa-2 item-card align-self-start d-flex flex-column bg-white h-auto ma-2 position-relative">
                  <img v-if="checkForImage(item)" class="media" :src="item" alt="">
                  <video v-else class="media" controls :src="item"/>
                  <div class="position-absolute controls flex-grow-1 d-flex pa-2">
                    <v-btn icon color="primary" size="x-small" class="mr-2" @click="removeItem(item)">
                      <v-icon>
                        mdi-close
                      </v-icon>
                    </v-btn>
                    <v-btn icon color="primary" size="x-small" @click="downloadItems([item])">
                      <v-icon>
                        mdi-download
                      </v-icon>
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </template>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useLocale } from 'vuetify'
import {getBase64} from "@/helpers";
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const CryptoJS = require("crypto-js")
const separator = '*-*'

export default {
  data() {
    return {
      items: [],
      secretString: '',
      encryptString: '',
      allowSaveSecret: false,
      isResultView: false,
      containerWidth: 1,
    }
  },

  setup() {
    const { t, current } = useLocale()

    return {
      t,
      locales: ['ru', 'en'],
      currentLocale: current,
    }
  },

  computed: {
    gap() {
      return Math.ceil(this.containerWidth / 316)
    },

    columns() {
      if (!this.items.length) return []
      const groups = new Array(this.gap)
      let currentIndex = 0
      let counter = 0
      while (counter < this.items.length) {
        if (!groups[currentIndex]) groups[currentIndex] = []
        if (currentIndex === this.gap - 1) currentIndex = 0
        if (currentIndex < this.gap - 1) {
          groups[currentIndex].push(this.items[counter])
        }
        counter++
        currentIndex++
      }
      return groups
    },
  },

  mounted() {
    this.containerWidth = this.$refs.container.$el.clientWidth
  },

  methods: {
    async changeItems(items) {
      this.items = await Promise.all(items.map((itemFile) => getBase64(itemFile)))
    },

    async encrypt() {
      const promises = this.items.map(async (item) => await CryptoJS.AES.encrypt(item, this.secretString).toString())
      this.encryptString = await Promise.all(promises).then((r) => r.join(separator))
    },

    async decrypt() {
      const rawItems = this.encryptString.split(separator)
      this.items = await Promise.all(rawItems.map(async (item) => await CryptoJS.AES.decrypt(item, this.secretString).toString(CryptoJS.enc.Utf8)))
    },

    saveResult(items, isLocked) {
      if (items.length === 1 && items[0].file !== this.encryptString) {
        const { filename, file } = items[0]
        FileSaver.saveAs(file, filename);
        return
      }
      const zip = new JSZip();
      items.forEach(({ filename, file }) => {
        zip.file(filename, file);
      })
      zip.generateAsync({ type: 'blob' }).then(function (content) {
        const flag = isLocked ? 'locked' : 'opened'
        FileSaver.saveAs(content, `filler-${flag}-${new Date().getTime()}.zip`);
      });
    },

    putArchive([archive]) {
      const newZip = new JSZip();

      newZip.loadAsync(archive)
        .then((zip) => {
          zip.file("secret.txt").async("string").then((r) => {
            this.encryptString = r
            if (this.secretString) {
              this.decrypt()
            }
          })
        });
    },

    updateSecret(secret) {
      if(this.allowSaveSecret) localStorage.setItem('secret', secret)
    },

    changeAllowSaveSecret(isAllow) {
      localStorage.setItem('allowSaveSecret', isAllow ? '1' : '0')
      if (!isAllow) localStorage.removeItem('secret')
      else {
        this.updateSecret(this.secretString)
      }
    },

    checkForImage(item) {
      return this.getItemStructure(item)[1] === 'image'
    },

    getItemStructure(item) {
      return item.match(/^data:(\w+)\/(\w+);/);
    },

    removeItem(item) {
      const index = this.items.findIndex((el) => el === item)
      if (index !== undefined) this.items.splice(index, 1)
    },

    async downloadItems(items) {
      const files = await Promise.all(items.map(async (el, index) => {
        const blob = await fetch(el)
          .then(res => res.blob())
        const format = this.getItemStructure(el)[2]
        const filename = `filler-${new Date().getTime() + index + 1}.${format}`
        return {
          filename,
          file: blob
        }
      }))
      this.saveResult(files)
    }
  },

  created() {
    this.allowSaveSecret = !!+localStorage.getItem('allowSaveSecret')
    const secret = localStorage.getItem('secret')
    if (this.allowSaveSecret && secret) this.secretString = secret
  },
}
</script>

<style lang="scss">
.media {
  max-width: 300px;
}

.item-card {
  .controls {
    opacity: 0;
  }
  &:hover {
    .controls {
      opacity: 1;
    }
  }
}
</style>

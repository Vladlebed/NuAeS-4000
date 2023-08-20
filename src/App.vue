<template>
  <v-app>
    <v-main class="bg-primary">
      <v-container>
        <v-row>
          <v-col>
            <v-card color="white" class="pa-4">
              <v-text-field v-model.trim="secretString" label="Cекретное слово" hide-details @update:model-value="updateSecret"/>
              <v-checkbox v-model="allowSaveSecret" color="primary" label="Сохранить в памяти браузера" hide-details @update:model-value="changeAllowSaveSecret"/>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 d-flex flex-column fill-height">
              <div class="flex-grow-1">
                <v-card-title>Ввод</v-card-title>
                <v-file-input label="Выбрать фото" variant="underlined" hide-details multiple class="mb-4" @update:model-value="changePhotos"/>
              </div>
              <v-btn width="100%" color="primary" class="mt-auto" :disabled="!photos.length || !secretString" @click="encrypt">Зашифровать</v-btn>
            </v-card>
          </v-col>
          <v-col xl="6" md="12">
            <v-card color="white" class="pa-4 fill-height">
              <v-card-title>Вывод</v-card-title>
              <div>
                <div class="d-flex">
                  <v-textarea v-model="encryptString" variant="underlined" label="Шифрованная строка" hide-details class="mb-4"/>
                  <div class="ml-4 d-flex flex-column">
                    <v-btn color="primary" :disabled="!encryptString" @click="copyResult">Скопировать</v-btn>
                    <v-btn color="primary" class="mt-4" :disabled="!encryptString" @click="saveResult">Скачать</v-btn>
                    <v-file-input label="Архив" variant="underlined" hide-details class="mb-4" @update:model-value="putArchive"/>
                  </div>
                </div>
                <v-btn width="100%" color="primary" class="mt-4" :disabled="!encryptString || !secretString" @click="decrypt">Расшифровать</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="d-flex flex-wrap">
            <v-card v-for="photo in photos" class="pa-2 bg-white ma-2">
              <img class="photo" :src="photo" alt="">
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {getBase64} from "@/helpers";
import copy from 'copy-to-clipboard'
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const CryptoJS = require("crypto-js")
const separator = '*-*'

export default {
  data() {
    return {
      photos: [],
      secretString: '',
      encryptString: '',
      allowSaveSecret: false,
    }
  },

  methods: {
    async changePhotos(photos) {
      this.photos = await Promise.all(photos.map((photoFile) => getBase64(photoFile)))
    },

    encrypt() {
      this.encryptString = CryptoJS.AES.encrypt(this.photos.join(separator), this.secretString).toString()
    },

    decrypt() {
      const bytes = CryptoJS.AES.decrypt(this.encryptString, this.secretString)
      this.photos = bytes.toString(CryptoJS.enc.Utf8).split(separator)
    },

    copyResult() {
      copy(this.encryptString)
    },

    saveResult() {
      const zip = new JSZip();
      zip.file('secret.txt', this.encryptString);
      zip.generateAsync({ type: 'blob' }).then(function (content) {
        FileSaver.saveAs(content, 'download.zip');
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
    }
  },

  created() {
    this.allowSaveSecret = !!+localStorage.getItem('allowSaveSecret')
    const secret = localStorage.getItem('secret')
    if (this.allowSaveSecret && secret) this.secretString = secret
  }
}
</script>

<style lang="scss">
.photo {
  max-width: 200px;
}
</style>
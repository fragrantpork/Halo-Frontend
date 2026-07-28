<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const isDrawerOpen = ref(true)

// Navigation items matching your custom vue-router configuration links
const navigationItems = [
  { title: 'Fleet Dashboard', icon: 'mdi-quadcopter', path: '/' },
  { title: 'Operations Missions', icon: 'mdi-file-map-outline', path: '/missions' },
]
</script>

<template>
  <v-app>
    <!-- App Bar Header -->
    <v-app-bar color="primary" elevation="1">
      <v-app-bar-nav-icon @click="isDrawerOpen = !isDrawerOpen" />
      <v-app-bar-title class="font-weight-black text-uppercase tracking-wider">
        AvHalo DroneFleet Command
      </v-app-bar-title>
    </v-app-bar>

    <!-- Sidebar Navigation Drawer -->
    <v-navigation-drawer v-model="isDrawerOpen" floating>
      <v-list nav class="mt-2">
        <v-list-item
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
          link
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Housing Platform -->
    <v-main class="bg-grey-lighten-4">
      <!-- The Vue Router automatically mounts FleetDashboard or MissionDetail exactly right here -->
      <RouterView />
    </v-main>
  </v-app>
</template>

<style>
/* Global style overrides can safely go here */
.font-code {
  font-family: 'Courier New', Courier, monospace;
}
</style>

import { writable } from 'svelte/store';
import { getProfile } from './profileService.js';

// Create a writable store for the current profile
export const currentProfile = writable(null);

// Initialize the store with the current profile
currentProfile.set(getProfile());

// Function to update the profile and notify all subscribers
export function updateProfile() {
  const profile = getProfile();
  currentProfile.set(profile);
}
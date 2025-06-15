// Export service modules individually to avoid naming conflicts
export * as AuthService from './auth'
export * as EventsService from './events'
export * as GuestsService from './guests'
export * as MediaService from './media'
export * as MessagingService from './messaging'
export * as StorageService from './storage'
export * as UsersService from './users'

// Export individual functions with aliases to avoid conflicts
export { getCurrentUser, getCurrentSession, signOut } from './auth'
export { 
  getEventById, 
  getHostEvents, 
  getGuestEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from './events'
export { 
  getEventGuests as getGuestsForEvent,
  createGuest,
  updateGuest,
  deleteGuest,
  importGuests
} from './guests'
export { 
  getEventMedia,
  uploadMedia,
  updateMediaCaption,
  deleteMedia,
  getMediaById
} from './media'
export { 
  getEventMessages,
  sendMessage,
  deleteMessage
} from './messaging'
export { 
  uploadFile,
  getPublicUrl,
  deleteFile,
  listFiles
} from './storage'
export { 
  getUserById,
  getUserByPhone as getPhoneUser,
  createUser,
  updateUser,
  deleteUser
} from './users' 
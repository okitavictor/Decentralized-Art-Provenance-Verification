import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract interactions
const mockArtworks = new Map()
const mockArtists = new Map()
let mockLastArtworkId = 0
const mockBlockHeight = 100

// Mock contract functions
const mockContractFunctions = {
  registerArtist: (name, biography, sender) => {
    const artistKey = JSON.stringify({ "artist-id": sender })
    if (mockArtists.has(artistKey)) {
      return { error: 2 } // ERR_ALREADY_REGISTERED
    }
    
    mockArtists.set(artistKey, {
      name,
      biography,
      verified: false,
    })
    
    return { value: true }
  },
  
  verifyArtist: (artistId, sender) => {
    // Only contract owner can verify
    if (sender !== "contract-owner") {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    const artistKey = JSON.stringify({ "artist-id": artistId })
    if (!mockArtists.has(artistKey)) {
      return { error: 3 } // ERR_INVALID_INPUT
    }
    
    const artist = mockArtists.get(artistKey)
    mockArtists.set(artistKey, { ...artist, verified: true })
    
    return { value: true }
  },
  
  registerArtwork: (title, creationDate, medium, dimensions, description, sender) => {
    const artistKey = JSON.stringify({ "artist-id": sender })
    if (!mockArtists.has(artistKey)) {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    const artist = mockArtists.get(artistKey)
    if (!artist.verified) {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    mockLastArtworkId++
    const artworkKey = JSON.stringify({ "artwork-id": mockLastArtworkId })
    
    mockArtworks.set(artworkKey, {
      title,
      "artist-id": sender,
      "creation-date": creationDate,
      medium,
      dimensions,
      description,
      "registered-at": mockBlockHeight,
    })
    
    return { value: true }
  },
  
  getArtwork: (artworkId) => {
    const artworkKey = JSON.stringify({ "artwork-id": artworkId })
    return mockArtworks.has(artworkKey) ? { value: mockArtworks.get(artworkKey) } : { value: null }
  },
  
  getArtist: (artistId) => {
    const artistKey = JSON.stringify({ "artist-id": artistId })
    return mockArtists.has(artistKey) ? { value: mockArtists.get(artistKey) } : { value: null }
  },
  
  getArtworkCount: () => {
    return { value: mockLastArtworkId }
  },
}

describe("Artwork Registration Contract", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockArtworks.clear()
    mockArtists.clear()
    mockLastArtworkId = 0
  })
  
  describe("registerArtist", () => {
    it("should register a new artist", () => {
      const result = mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      
      expect(result.value).toBe(true)
      
      const artist = mockContractFunctions.getArtist("artist1").value
      expect(artist).not.toBeNull()
      expect(artist.name).toBe("Pablo Picasso")
      expect(artist.biography).toBe("Spanish painter and sculptor")
      expect(artist.verified).toBe(false)
    })
    
    it("should not register an artist twice", () => {
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      const result = mockContractFunctions.registerArtist("Pablo Picasso", "Updated bio", "artist1")
      
      expect(result.error).toBe(2) // ERR_ALREADY_REGISTERED
    })
  })
  
  describe("verifyArtist", () => {
    it("should verify an artist when called by contract owner", () => {
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      const result = mockContractFunctions.verifyArtist("artist1", "contract-owner")
      
      expect(result.value).toBe(true)
      
      const artist = mockContractFunctions.getArtist("artist1").value
      expect(artist.verified).toBe(true)
    })
    
    it("should not verify an artist when called by non-owner", () => {
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      const result = mockContractFunctions.verifyArtist("artist1", "not-owner")
      
      expect(result.error).toBe(1) // ERR_UNAUTHORIZED
      
      const artist = mockContractFunctions.getArtist("artist1").value
      expect(artist.verified).toBe(false)
    })
    
    it("should not verify a non-existent artist", () => {
      const result = mockContractFunctions.verifyArtist("non-existent", "contract-owner")
      
      expect(result.error).toBe(3) // ERR_INVALID_INPUT
    })
  })
  
  describe("registerArtwork", () => {
    it("should register artwork for verified artist", () => {
      // Register and verify artist
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      mockContractFunctions.verifyArtist("artist1", "contract-owner")
      
      // Register artwork
      const result = mockContractFunctions.registerArtwork(
          "Guernica",
          1937,
          "Oil on canvas",
          "349 cm × 776 cm",
          "Painting depicting the bombing of Guernica",
          "artist1",
      )
      
      expect(result.value).toBe(true)
      
      // Check artwork was registered
      const artwork = mockContractFunctions.getArtwork(1).value
      expect(artwork).not.toBeNull()
      expect(artwork.title).toBe("Guernica")
      expect(artwork["artist-id"]).toBe("artist1")
      expect(artwork["creation-date"]).toBe(1937)
    })
    
    it("should not register artwork for unverified artist", () => {
      // Register artist but don't verify
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      
      // Try to register artwork
      const result = mockContractFunctions.registerArtwork(
          "Guernica",
          1937,
          "Oil on canvas",
          "349 cm × 776 cm",
          "Painting depicting the bombing of Guernica",
          "artist1",
      )
      
      expect(result.error).toBe(1) // ERR_UNAUTHORIZED
      
      // Check no artwork was registered
      expect(mockContractFunctions.getArtworkCount().value).toBe(0)
    })
    
    it("should not register artwork for non-existent artist", () => {
      // Try to register artwork for non-existent artist
      const result = mockContractFunctions.registerArtwork(
          "Guernica",
          1937,
          "Oil on canvas",
          "349 cm × 776 cm",
          "Painting depicting the bombing of Guernica",
          "non-existent",
      )
      
      expect(result.error).toBe(1) // ERR_UNAUTHORIZED
      
      // Check no artwork was registered
      expect(mockContractFunctions.getArtworkCount().value).toBe(0)
    })
  })
  
  describe("getArtwork", () => {
    it("should return artwork details for valid ID", () => {
      // Register and verify artist
      mockContractFunctions.registerArtist("Pablo Picasso", "Spanish painter and sculptor", "artist1")
      mockContractFunctions.verifyArtist("artist1", "contract-owner")
      
      // Register artwork
      mockContractFunctions.registerArtwork(
          "Guernica",
          1937,
          "Oil on canvas",
          "349 cm × 776 cm",
          "Painting depicting the bombing of Guernica",
          "artist1",
      )
      
      // Get artwork
      const artwork = mockContractFunctions.getArtwork(1).value
      
      expect(artwork).not.toBeNull()
      expect(artwork.title).toBe("Guernica")
      expect(artwork.medium).toBe("Oil on canvas")
      expect(artwork["registered-at"]).toBe(mockBlockHeight)
    })
    
    it("should return null for invalid artwork ID", () => {
      const artwork = mockContractFunctions.getArtwork(999).value
      expect(artwork).toBeNull()
    })
  })
})


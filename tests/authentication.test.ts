import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract interactions
const mockAuthenticators = new Map()
const mockAuthentications = new Map()
const mockBlockHeight = 100

// Mock contract functions
const mockContractFunctions = {
  registerAuthenticator: (name, credentials, sender) => {
    const authenticatorKey = JSON.stringify({ "authenticator-id": sender })
    if (mockAuthenticators.has(authenticatorKey)) {
      return { error: 2 } // ERR_ALREADY_REGISTERED
    }
    
    mockAuthenticators.set(authenticatorKey, {
      name,
      credentials,
      verified: false,
    })
    
    return { value: true }
  },
  
  verifyAuthenticator: (authenticatorId, sender) => {
    // Only contract owner can verify
    if (sender !== "contract-owner") {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    const authenticatorKey = JSON.stringify({ "authenticator-id": authenticatorId })
    if (!mockAuthenticators.has(authenticatorKey)) {
      return { error: 3 } // ERR_INVALID_INPUT
    }
    
    const authenticator = mockAuthenticators.get(authenticatorKey)
    mockAuthenticators.set(authenticatorKey, { ...authenticator, verified: true })
    
    return { value: true }
  },
  
  authenticateArtwork: (artworkId, isAuthentic, assessmentNotes, evidenceHash, sender) => {
    const authenticatorKey = JSON.stringify({ "authenticator-id": sender })
    if (!mockAuthenticators.has(authenticatorKey)) {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    const authenticator = mockAuthenticators.get(authenticatorKey)
    if (!authenticator.verified) {
      return { error: 1 } // ERR_UNAUTHORIZED
    }
    
    const authenticationKey = JSON.stringify({ "artwork-id": artworkId })
    if (mockAuthentications.has(authenticationKey)) {
      return { error: 4 } // ERR_ALREADY_AUTHENTICATED
    }
    
    mockAuthentications.set(authenticationKey, {
      authenticator: sender,
      "is-authentic": isAuthentic,
      "assessment-date": mockBlockHeight,
      "assessment-notes": assessmentNotes,
      "evidence-hash": evidenceHash,
    })
    
    return { value: true }
  },
  
  getAuthentication: (artworkId) => {
    const authenticationKey = JSON.stringify({ "artwork-id": artworkId })
    return mockAuthentications.has(authenticationKey)
        ? { value: mockAuthentications.get(authenticationKey) }
        : { value: null }
  },
  
  getAuthenticator: (authenticatorId) => {
    const authenticatorKey = JSON.stringify({ "authenticator-id": authenticatorId })
    return mockAuthenticators.has(authenticatorKey)
        ? { value: mockAuthenticators.get(authenticatorKey) }
        : { value: null }
  },
}

describe("Authentication Contract", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockAuthenticators.clear()
    mockAuthentications.clear()
  })
  
  describe("registerAuthenticator", () => {
    it("should register a new authenticator", () => {
      const result = mockContractFunctions.registerAuthenticator(
          "Art Expert Inc.",
          "Certified by International Art Association",
          "auth1",
      )
      
      expect(result.value).toBe(true)
      
      const authenticator = mockContractFunctions.getAuthenticator("auth1").value
      expect(authenticator).not.toBeNull()
      expect(authenticator.name).toBe("Art Expert Inc.")
      expect(authenticator.credentials).toBe("Certified by International Art Association")
      expect(authenticator.verified).toBe(false)
    })
    
    it("should not register an authenticator twice", () => {
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      const result = mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Updated credentials", "auth1")
      
      expect(result.error).toBe(2) // ERR_ALREADY_REGISTERED
    })
  })
  
  describe("verifyAuthenticator", () => {
    it("should verify an authenticator when called by contract owner", () => {
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      const result = mockContractFunctions.verifyAuthenticator("auth1", "contract-owner")
      
      expect(result.value).toBe(true)
      
      const authenticator = mockContractFunctions.getAuthenticator("auth1").value
      expect(authenticator.verified).toBe(true)
    })
    
    it("should not verify an authenticator when called by non-owner", () => {
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      const result = mockContractFunctions.verifyAuthenticator("auth1", "not-owner")
      
      expect(result.error).toBe(1) // ERR_UNAUTHORIZED
      
      const authenticator = mockContractFunctions.getAuthenticator("auth1").value
      expect(authenticator.verified).toBe(false)
    })
  })
  
  describe("authenticateArtwork", () => {
    it("should authenticate artwork by verified authenticator", () => {
      // Register and verify authenticator
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      mockContractFunctions.verifyAuthenticator("auth1", "contract-owner")
      
      // Authenticate artwork
      const result = mockContractFunctions.authenticateArtwork(
          1,
          true,
          "Confirmed original brushwork and pigments match the artist's known works",
          new Uint8Array(32).fill(1), // Mock hash
          "auth1",
      )
      
      expect(result.value).toBe(true)
      
      // Check authentication was recorded
      const authentication = mockContractFunctions.getAuthentication(1).value
      expect(authentication).not.toBeNull()
      expect(authentication.authenticator).toBe("auth1")
      expect(authentication["is-authentic"]).toBe(true)
    })
    
    it("should not authenticate artwork by unverified authenticator", () => {
      // Register authenticator but don't verify
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      
      // Try to authenticate artwork
      const result = mockContractFunctions.authenticateArtwork(
          1,
          true,
          "Assessment notes",
          new Uint8Array(32).fill(1),
          "auth1",
      )
      
      expect(result.error).toBe(1) // ERR_UNAUTHORIZED
      
      // Check no authentication was recorded
      const authentication = mockContractFunctions.getAuthentication(1).value
      expect(authentication).toBeNull()
    })
    
    it("should not authenticate an artwork twice", () => {
      // Register and verify authenticator
      mockContractFunctions.registerAuthenticator("Art Expert Inc.", "Certified", "auth1")
      mockContractFunctions.verifyAuthenticator("auth1", "contract-owner")
      
      // Authenticate artwork
      mockContractFunctions.authenticateArtwork(1, true, "Assessment notes", new Uint8Array(32).fill(1), "auth1")
      
      // Try to authenticate again
      const result = mockContractFunctions.authenticateArtwork(
          1,
          false,
          "Different assessment",
          new Uint8Array(32).fill(2),
          "auth1",
      )
      
      expect(result.error).toBe(4) // ERR_ALREADY_AUTHENTICATED
    })
  })
})


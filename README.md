# Decentralized Art Provenance Verification

This blockchain platform establishes an immutable record of artwork provenance, enabling transparent authentication, ownership tracking, and exhibition history documentation. By creating a trusted digital ledger for art verification, the system helps combat forgery while enhancing artwork value through verifiable provenance.

## System Overview

The Decentralized Art Provenance Verification platform consists of four primary smart contracts:

1. **Artwork Registration Contract**: Documents art creation with comprehensive metadata
2. **Authentication Contract**: Records expert verification of artwork authenticity
3. **Ownership Transfer Contract**: Tracks the complete chain of possession
4. **Exhibition History Contract**: Maintains records of public displays and locations

## Getting Started

### Prerequisites

- Node.js (v16.0+)
- Blockchain development environment (Truffle/Hardhat)
- Web3 library
- IPFS integration for image and document storage
- Digital wallet (MetaMask or similar)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/art-provenance-verification.git
   cd art-provenance-verification
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Compile smart contracts
   ```
   npx hardhat compile
   ```

4. Deploy to test network
   ```
   npx hardhat run scripts/deploy.js --network testnet
   ```

## Smart Contract Architecture

### Artwork Registration Contract
Records comprehensive details about artwork including creation date, artist information, medium, dimensions, title, and initial documentation. Creates a unique digital identifier linked to high-resolution imagery and technical analysis data.

### Authentication Contract
Validates artwork authenticity through expert assessment. Records credentials of authentication authorities, methodologies used (technical analysis, stylistic evaluation, historical research), and confidence level of verification results.

### Ownership Transfer Contract
Documents the complete chain of custody from artist to current owner. Records each transfer including buyer, seller, transaction date, sale price, and supporting documentation such as bills of sale and certificates of authenticity.

### Exhibition History Contract
Maintains a chronological record of public displays including exhibition names, hosting institutions, dates, and geographic locations. Links to exhibition catalogs, installation photographs, and condition reports.

## Usage Examples

### Registering an Artwork
```javascript
const artworkRegistry = await ArtworkRegistrationContract.deployed();
await artworkRegistry.registerArtwork(
  "Midnight Reflections",
  "Sarah Chen",
  "2023-08-15", // creation date
  "Oil on canvas",
  "76 x 102 cm",
  "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/artwork.jpg",
  "Abstract expressionist landscape featuring nocturnal water scene",
  "ARTIST-ID-756"
);
```

### Recording Authentication
```javascript
const authenticationContract = await AuthenticationContract.deployed();
await authenticationContract.recordAuthentication(
  "ARTWORK-1234", // artwork ID
  "AUTHENTICATOR-5678", // authenticator ID
  "Technical analysis conducted with infrared reflectography, XRF, and stylistic comparison",
  "VERIFIED",
  "https://ipfs.io/ipfs/QmRzTuh5EYuMqQNwTwBnmC2qAN7TwH5T9NpifziwKLgMtT/report.pdf",
  "2025-03-12" // authentication date
);
```

## Features

- **Immutable Provenance**: Creates tamper-proof records of artwork history
- **Expert Verification**: Documents professional authentication credentials and methods
- **Ownership Transparency**: Provides complete tracking of possession transfers
- **Exhibition Documentation**: Maintains chronological display history
- **Forgery Prevention**: Establishes verifiable creation and authentication records
- **Value Enhancement**: Increases artwork worth through proven provenance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact: support@artprovenanceblockchain.org

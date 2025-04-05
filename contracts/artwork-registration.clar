;; Artwork Registration Contract
;; Records details of artwork creation and artist information

;; Define data maps
(define-map artworks
  { artwork-id: uint }
  {
    title: (string-utf8 100),
    artist-id: principal,
    creation-date: uint,
    medium: (string-utf8 50),
    dimensions: (string-utf8 50),
    description: (string-utf8 500),
    registered-at: uint
  }
)

(define-map artists
  { artist-id: principal }
  {
    name: (string-utf8 100),
    biography: (string-utf8 500),
    verified: bool
  }
)

;; Define data variables
(define-data-var last-artwork-id uint u0)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_REGISTERED u2)
(define-constant ERR_INVALID_INPUT u3)

;; Register a new artist
(define-public (register-artist (name (string-utf8 100)) (biography (string-utf8 500)))
  (let ((artist-exists (default-to false (get verified (map-get? artists { artist-id: tx-sender })))))
    (if artist-exists
      (err ERR_ALREADY_REGISTERED)
      (ok (map-set artists
        { artist-id: tx-sender }
        {
          name: name,
          biography: biography,
          verified: false
        }
      ))
    )
  )
)

;; Verify an artist (only contract owner can do this)
(define-public (verify-artist (artist-id principal))
  (begin
    (asserts! (is-eq tx-sender (contract-owner)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (map-get? artists { artist-id: artist-id })) (err ERR_INVALID_INPUT))
    (ok (map-set artists
      { artist-id: artist-id }
      (merge (unwrap-panic (map-get? artists { artist-id: artist-id }))
        { verified: true })
    ))
  )
)

;; Register a new artwork
(define-public (register-artwork
    (title (string-utf8 100))
    (creation-date uint)
    (medium (string-utf8 50))
    (dimensions (string-utf8 50))
    (description (string-utf8 500)))
  (let (
    (artist-data (map-get? artists { artist-id: tx-sender }))
    (new-artwork-id (+ (var-get last-artwork-id) u1))
  )
    (asserts! (is-some artist-data) (err ERR_UNAUTHORIZED))
    (asserts! (get verified (unwrap-panic artist-data)) (err ERR_UNAUTHORIZED))

    ;; Update the last artwork ID
    (var-set last-artwork-id new-artwork-id)

    ;; Register the new artwork
    (ok (map-set artworks
      { artwork-id: new-artwork-id }
      {
        title: title,
        artist-id: tx-sender,
        creation-date: creation-date,
        medium: medium,
        dimensions: dimensions,
        description: description,
        registered-at: block-height
      }
    ))
  )
)

;; Get artwork details
(define-read-only (get-artwork (artwork-id uint))
  (map-get? artworks { artwork-id: artwork-id })
)

;; Get artist details
(define-read-only (get-artist (artist-id principal))
  (map-get? artists { artist-id: artist-id })
)

;; Get the total number of registered artworks
(define-read-only (get-artwork-count)
  (var-get last-artwork-id)
)

;; Helper function to get contract owner
(define-private (contract-owner)
  (as-contract tx-sender)
)


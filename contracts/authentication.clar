;; Authentication Contract
;; Validates expert assessments of artwork authenticity

;; Define data maps
(define-map authenticators
  { authenticator-id: principal }
  {
    name: (string-utf8 100),
    credentials: (string-utf8 200),
    verified: bool
  }
)

(define-map authentications
  { artwork-id: uint }
  {
    authenticator: principal,
    is-authentic: bool,
    assessment-date: uint,
    assessment-notes: (string-utf8 500),
    evidence-hash: (buff 32)
  }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_REGISTERED u2)
(define-constant ERR_INVALID_INPUT u3)
(define-constant ERR_ALREADY_AUTHENTICATED u4)

;; Register a new authenticator
(define-public (register-authenticator (name (string-utf8 100)) (credentials (string-utf8 200)))
  (let ((authenticator-exists (default-to false (get verified (map-get? authenticators { authenticator-id: tx-sender })))))
    (if authenticator-exists
      (err ERR_ALREADY_REGISTERED)
      (ok (map-set authenticators
        { authenticator-id: tx-sender }
        {
          name: name,
          credentials: credentials,
          verified: false
        }
      ))
    )
  )
)

;; Verify an authenticator (only contract owner can do this)
(define-public (verify-authenticator (authenticator-id principal))
  (begin
    (asserts! (is-eq tx-sender (contract-owner)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (map-get? authenticators { authenticator-id: authenticator-id })) (err ERR_INVALID_INPUT))
    (ok (map-set authenticators
      { authenticator-id: authenticator-id }
      (merge (unwrap-panic (map-get? authenticators { authenticator-id: authenticator-id }))
        { verified: true })
    ))
  )
)

;; Authenticate an artwork
(define-public (authenticate-artwork
    (artwork-id uint)
    (is-authentic bool)
    (assessment-notes (string-utf8 500))
    (evidence-hash (buff 32)))
  (let (
    (authenticator-data (map-get? authenticators { authenticator-id: tx-sender }))
    (existing-authentication (map-get? authentications { artwork-id: artwork-id }))
  )
    ;; Check if authenticator is verified
    (asserts! (is-some authenticator-data) (err ERR_UNAUTHORIZED))
    (asserts! (get verified (unwrap-panic authenticator-data)) (err ERR_UNAUTHORIZED))

    ;; Check if artwork is already authenticated
    (asserts! (is-none existing-authentication) (err ERR_ALREADY_AUTHENTICATED))

    ;; Record the authentication
    (ok (map-set authentications
      { artwork-id: artwork-id }
      {
        authenticator: tx-sender,
        is-authentic: is-authentic,
        assessment-date: block-height,
        assessment-notes: assessment-notes,
        evidence-hash: evidence-hash
      }
    ))
  )
)

;; Get authentication details for an artwork
(define-read-only (get-authentication (artwork-id uint))
  (map-get? authentications { artwork-id: artwork-id })
)

;; Get authenticator details
(define-read-only (get-authenticator (authenticator-id principal))
  (map-get? authenticators { authenticator-id: authenticator-id })
)

;; Helper function to get contract owner
(define-private (contract-owner)
  (as-contract tx-sender)
)


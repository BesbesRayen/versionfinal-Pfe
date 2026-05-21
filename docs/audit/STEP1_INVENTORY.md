# STEP 1 - Scan & Inventory

Scope: source/config/database/script/test/static files under the project root. Generated/vendor/build output is excluded from the file-by-file table and listed separately.

Generated/vendor/build directories found and excluded from semantic inventory:
- `Dashboard_client-main/node_modules`, `Dashboard_client-main/.next`
- `frontend mobile/node_modules`, `frontend mobile/dist`
- `socket-server/node_modules`
- `creadiTn/target`

Summary:
- Files inventoried: 360
- Major apps: Spring backend (`creadiTn`), Next dashboard/landing (`Dashboard_client-main`), Expo/mobile frontend (`frontend mobile`), Socket.IO server (`socket-server`).
- No files were deleted or moved in Step 1.
- Homepage color request is flagged below; implementation is intentionally paused until you confirm the next step or explicitly authorize the isolated UI fix.

## High Priority Flags

- `Dashboard_client-main/src/components/Hero.tsx`: UI color mismatch; current homepage is light while other interfaces are dark. Requested fix: return accueil/dashboard landing to dark theme.
- `Dashboard_client-main/src/lib/db.js`: architecture risk; a frontend/Next app contains a direct MySQL connector. Should likely be moved behind backend service/API boundaries.
- `Dashboard_client-main/src/app/api/auth/*`, `api/contact`, `api/messages`: possible duplicated backend responsibility because Spring already owns auth/support/domain APIs.
- Root `package-lock.json`: redundant because there is no root `package.json`.
- `.gitignore#`, `nulgit`, empty `run-logs/*.log`: orphan/generated files that can likely be deleted.
- `creaditn (2).sql` and empty directory `creaditn (1).sql`: poorly named root SQL artifacts; should move under `scripts/db` or delete after schema audit.
- `scripts/db/reset-postgresql.sql`: likely redundant because runtime uses MySQL, unless kept for future portability.
- `frontend mobile/vitest.config.ts` vs `vitest.config.mjs`: likely duplicate config; package script uses `.mjs`.

## File Inventory

| File | Description | Flags |
|---|---|---|
| `.env` | Local environment variables used by Docker/backend/frontend; secret-bearing and not for commit. |  |
| `.env.example` | Template of required environment variables for local setup. |  |
| `.gitignore` | Git ignore rules for dependencies, generated output, logs, and local env files. |  |
| `.gitignore#` | Editor backup/stray file, not part of project behavior. | WRONG/ORPHAN: editor backup; can delete; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `ARCHITECTURE.md` | Existing architecture documentation for the multi-app project. |  |
| `creaditn (2).sql` | SQL schema, reset, migration, or database seed script. | WRONG LOCATION/NAME: root SQL dump with numbered filename |
| `creadiTn\.data\creaditn.mv.db` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.dockerignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.gitattributes` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.gitignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.idea\.gitignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.idea\misc.xml` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.idea\vcs.xml` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.idea\workspace.xml` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\.mvn\wrapper\maven-wrapper.properties` | Project file; requires deeper semantic review in later audit steps. |  |
| `creadiTn\API_TESTING_GUIDE.md` | Backend documentation or learning/testing guide. |  |
| `creadiTn\ARCHITECTURE_VISUAL.md` | Backend documentation or learning/testing guide. |  |
| `creadiTn\Dockerfile` | Docker image definition for the Spring Boot backend. |  |
| `creadiTn\LEARNING_GUIDE_FR.md` | Backend documentation or learning/testing guide. |  |
| `creadiTn\mvnw` | Maven wrapper executable for reproducible backend builds. |  |
| `creadiTn\mvnw.cmd` | Maven wrapper executable for reproducible backend builds. |  |
| `creadiTn\pom.xml` | Maven project manifest and dependency definition for the Spring Boot backend. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\config\JacksonConfig.java` | Spring configuration class for MVC, Swagger, Jackson, or mail behavior. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\config\MailConfig.java` | Spring configuration class for MVC, Swagger, Jackson, or mail behavior. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\config\SwaggerConfig.java` | Spring configuration class for MVC, Swagger, Jackson, or mail behavior. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\config\WebMvcConfig.java` | Spring configuration class for MVC, Swagger, Jackson, or mail behavior. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AdminArticleController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AdminController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AdminInvoiceController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AdminNotificationController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AdminPurchaseController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\ArticleController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\AuthController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\CardController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\CreadiScoreController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\CreditController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\DashboardController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\DevDatabaseResetController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\FinancialProfileController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\KycController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\MerchantController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\NotificationController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\PaymentController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\PurchaseController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\ReceiptController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\RewardsController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\SupportController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\TransactionController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\controller\UserController.java` | Spring MVC REST controller exposing backend API endpoints. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\CreadiTnApplication.java` | Spring Boot backend application entry point. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\AccountStatusDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\AdminNotificationDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ApiResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ArticleRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ArticleResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\AuthRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\AuthResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\AutopaySettingsDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CardCreateRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CardDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CashbackDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CashbackHistoryDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CashbackOfferDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreadiScoreResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreateFinancialProfileRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreditBalanceResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreditRequestDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreditRequestResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreditSimulationRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\CreditSimulationResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\DashboardResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\FinancialProfileDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\FinancialProfileRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ForgotEmailRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ForgotPasswordConfirmRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ForgotPasswordRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\GoogleAuthRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\InstallmentDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\InstallmentPlanItemDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\InvoiceResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\KycAuditLogDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\KycDecisionRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\KycDocumentDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\KycVerificationResultDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\MerchantDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\NotificationDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PasswordChangeRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PayAllResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PaymentDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PaymentMethodDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PaymentRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PurchaseArticleRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\PurchaseOrderResponse.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\RegisterRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\ResendVerificationRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\RevealEmailRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\SupportFaqDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\SupportFeedbackRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\SupportTicketCreateRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\SupportTicketDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\TransactionDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\UpdateRecoveredEmailRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\UserDto.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\dto\VerifyEmailRequest.java` | Backend DTO/request/response object used at API boundaries. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\AdminNotification.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\AdminNotificationType.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Article.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\BaseEntity.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Card.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\CardStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\CardType.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\CreadiScore.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\CreditRequest.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\CreditRequestStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\EmploymentStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\FinancialProfile.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Installment.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\InstallmentStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Invoice.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\InvoiceStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\KycAuditLog.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\KycDocument.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\KycStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Merchant.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Notification.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\NotificationType.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Payment.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\PurchaseOrder.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\PurchaseOrderStatus.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\PurchasePaymentType.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\RiskLevel.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\ScoreLevel.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\Transaction.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\User.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\entity\UserWallet.java` | JPA entity or enum representing backend domain/database model. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\exception\BadRequestException.java` | Backend exception type or global exception handler. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\exception\GlobalExceptionHandler.java` | Backend exception type or global exception handler. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\exception\ResourceNotFoundException.java` | Backend exception type or global exception handler. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\exception\UnauthorizedException.java` | Backend exception type or global exception handler. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\kyc\service\DiditClient.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\kyc\service\KycDecision.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\kyc\service\KycDecisionService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\AdminNotificationRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\ArticleRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\CardRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\CreadiScoreRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\CreditRequestRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\FinancialProfileRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\InstallmentRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\InvoiceRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\KycAuditLogRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\KycDocumentRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\MerchantRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\NotificationRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\PaymentRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\PurchaseOrderRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\TransactionRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\UserRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\repository\UserWalletRepository.java` | Spring Data JPA repository for persistence access. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\scheduler\AutopayScheduler.java` | Scheduled backend job for payments, reminders, or overdue installment handling. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\scheduler\OverdueInstallmentScheduler.java` | Scheduled backend job for payments, reminders, or overdue installment handling. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\scheduler\PaymentReminderScheduler.java` | Scheduled backend job for payments, reminders, or overdue installment handling. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\security\AdminAuthFilter.java` | Backend security/JWT/admin authentication component. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\security\JwtAuthenticationFilter.java` | Backend security/JWT/admin authentication component. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\security\JwtUtil.java` | Backend security/JWT/admin authentication component. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\security\SecurityConfig.java` | Backend security/JWT/admin authentication component. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\AdminNotificationService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\ArticleService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\AuthService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\CardService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\CreadiScoreService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\CreditService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\DevDatabaseResetService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\EmailService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\FinancialProfileService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\InstallmentService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\InvoiceService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\KycService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\NotificationService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\OcrService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\PaymentService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\PurchaseService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\RewardsService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\SocketEventService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\SupportService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\TransactionService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\service\UserService.java` | Spring service containing business logic and orchestration. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\util\CardCryptoUtil.java` | Backend utility/helper class. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\util\CreditCalculator.java` | Backend utility/helper class. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\util\UserUtil.java` | Backend utility/helper class. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\validation\AllowedInstallmentDuration.java` | Custom backend validation annotation or validator. |  |
| `creadiTn\src\main\java\com\creaditn\creaditnbackend\validation\AllowedInstallmentDurationValidator.java` | Custom backend validation annotation or validator. |  |
| `creadiTn\src\main\resources\application.properties` | Backend SQL schema resource used for database initialization/reference. |  |
| `creadiTn\src\main\resources\schema.sql` | SQL schema, reset, migration, or database seed script. |  |
| `creadiTn\src\main\resources\schema-bnpl.sql` | SQL schema, reset, migration, or database seed script. | POSSIBLE DUPLICATE: overlaps schema.sql/current SQL dump |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\CreadiTnApplicationTests.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\dto\InstallmentDurationValidationTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\kyc\service\KycDecisionServiceTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\scheduler\AutopaySchedulerTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\service\CreadiScoreServiceTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\service\CreditServiceTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\service\InstallmentServiceTest.java` | Backend unit/integration test class. |  |
| `creadiTn\src\test\java\com\creaditn\creaditnbackend\util\CreditCalculatorTest.java` | Backend unit/integration test class. |  |
| `Dashboard_client-main\.dockerignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `Dashboard_client-main\.gitignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `Dashboard_client-main\.npmrc` | Project file; requires deeper semantic review in later audit steps. |  |
| `Dashboard_client-main\Dockerfile` | Docker image definition for the Next.js dashboard/landing app. |  |
| `Dashboard_client-main\eslint.config.mjs` | ESLint configuration for the dashboard project. |  |
| `Dashboard_client-main\next.config.js` | Next.js runtime/build configuration for standalone Docker output and image handling. |  |
| `Dashboard_client-main\next-env.d.ts` | Project file; requires deeper semantic review in later audit steps. |  |
| `Dashboard_client-main\package.json` | Next.js dashboard npm package manifest or lockfile. |  |
| `Dashboard_client-main\package-lock.json` | Next.js dashboard npm package manifest or lockfile. |  |
| `Dashboard_client-main\postcss.config.js` | PostCSS pipeline configuration for Tailwind/autoprefixer. |  |
| `Dashboard_client-main\src\app\admin\articles\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\credits\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\installments\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\invoices\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\kyc\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\layout.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\login\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\messages\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\notifications\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\admin\users\page.tsx` | Admin dashboard route page or admin layout component. |  |
| `Dashboard_client-main\src\app\api\auth\[...nextauth]\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. | POSSIBLE DUPLICATE: auth exists in Spring backend too |
| `Dashboard_client-main\src\app\api\auth\login\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. | POSSIBLE DUPLICATE: auth exists in Spring backend too |
| `Dashboard_client-main\src\app\api\auth\register\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. | POSSIBLE DUPLICATE: auth exists in Spring backend too |
| `Dashboard_client-main\src\app\api\backend\[...path]\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. |  |
| `Dashboard_client-main\src\app\api\contact\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. | ARCHITECTURE RISK: dashboard API may bypass backend service layer |
| `Dashboard_client-main\src\app\api\messages\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. | ARCHITECTURE RISK: dashboard API may bypass backend service layer |
| `Dashboard_client-main\src\app\api\scrape-product\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. |  |
| `Dashboard_client-main\src\app\api\test-connection\route.ts` | Next.js API route/proxy handler used by dashboard or landing pages. |  |
| `Dashboard_client-main\src\app\boutiques\[id]\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\app\boutiques\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\app\dashboard\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\app\globals.css` | Global dashboard CSS, Tailwind layers, utilities, and shared visual tokens. |  |
| `Dashboard_client-main\src\app\layout.tsx` | Root Next.js layout wiring providers and global shell. |  |
| `Dashboard_client-main\src\app\login\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\app\page.tsx` | Project file; requires deeper semantic review in later audit steps. |  |
| `Dashboard_client-main\src\app\register\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\app\support\page.tsx` | Next.js app-router page for public/client-facing dashboard route. |  |
| `Dashboard_client-main\src\components\ConditionalLayout.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\ContactForm.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\DownloadCTA.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\FAQAccordion.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\Features.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\Footer.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\Hero.tsx` | Reusable dashboard/landing React component. | UI ISSUE: homepage color should return to dark theme per request |
| `Dashboard_client-main\src\components\HowItWorks.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\Navbar.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\PartnersPreview.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\PopularProductsReel.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\Providers.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\QRModal.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\components\StoreCard.tsx` | Reusable dashboard/landing React component. |  |
| `Dashboard_client-main\src\data\boutiques.ts` | Static dashboard/landing data used by pages and components. |  |
| `Dashboard_client-main\src\data\faq.ts` | Static dashboard/landing data used by pages and components. |  |
| `Dashboard_client-main\src\lib\api.ts` | Dashboard shared helper, API client, socket hook, database connector, or utility. |  |
| `Dashboard_client-main\src\lib\db.js` | Dashboard shared helper, API client, socket hook, database connector, or utility. | ARCHITECTURE RISK: frontend app has direct DB connector |
| `Dashboard_client-main\src\lib\useSocket.ts` | Dashboard shared helper, API client, socket hook, database connector, or utility. |  |
| `Dashboard_client-main\src\lib\utils.ts` | Dashboard shared helper, API client, socket hook, database connector, or utility. |  |
| `Dashboard_client-main\tailwind.config.js` | Tailwind CSS design token and content scanning configuration for dashboard. |  |
| `Dashboard_client-main\tsconfig.json` | TypeScript compiler configuration for the dashboard project. |  |
| `Dashboard_client-main\tsconfig.tsbuildinfo` | Project file; requires deeper semantic review in later audit steps. |  |
| `docker-compose.yml` | Main Docker Compose orchestration for MySQL, backend, dashboard, socket server, and phpMyAdmin. |  |
| `frontend mobile\.env.example` | Project file; requires deeper semantic review in later audit steps. |  |
| `frontend mobile\.gitignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `frontend mobile\app.json` | Expo app metadata, scheme, and platform configuration. |  |
| `frontend mobile\babel.config.cjs` | Babel configuration for Expo/React Native. |  |
| `frontend mobile\components.json` | UI component tooling configuration. |  |
| `frontend mobile\eslint.config.js` | ESLint configuration for the mobile app. |  |
| `frontend mobile\index.js` | Expo/React Native app entry registration. |  |
| `frontend mobile\package.json` | Expo/mobile frontend npm package manifest or lockfile. |  |
| `frontend mobile\package-lock.json` | Expo/mobile frontend npm package manifest or lockfile. |  |
| `frontend mobile\playwright.config.ts` | Playwright end-to-end/browser test configuration or fixture. |  |
| `frontend mobile\playwright-fixture.ts` | Playwright end-to-end/browser test configuration or fixture. |  |
| `frontend mobile\postcss.config.js` | PostCSS configuration for mobile web export styling. |  |
| `frontend mobile\public\favicon.ico` | Static public asset for mobile web export. |  |
| `frontend mobile\public\placeholder.svg` | Static public asset for mobile web export. |  |
| `frontend mobile\README.md` | Mobile app documentation. |  |
| `frontend mobile\src\App.tsx` | Mobile app root navigation shell. |  |
| `frontend mobile\src\components\BottomNav.tsx` | Reusable mobile UI/layout component. |  |
| `frontend mobile\src\components\FintechUI.tsx` | Reusable mobile UI/layout component. |  |
| `frontend mobile\src\components\MobileLayout.tsx` | Reusable mobile UI/layout component. |  |
| `frontend mobile\src\components\shops\ArticleCard.tsx` | Reusable shop/product UI component for mobile shopping flows. |  |
| `frontend mobile\src\components\shops\ProductGridCard.tsx` | Reusable shop/product UI component for mobile shopping flows. |  |
| `frontend mobile\src\components\shops\ShopListItem.tsx` | Reusable shop/product UI component for mobile shopping flows. |  |
| `frontend mobile\src\data\shopCatalog.json` | Static mobile data catalog. |  |
| `frontend mobile\src\lib\api.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\app-navigation.tsx` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\auth.tsx` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\cart.tsx` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\creditPreview.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\deep-links.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\socket.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\theme.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\lib\utils.ts` | Mobile shared API, auth, navigation, socket, cart, theme, or utility module. |  |
| `frontend mobile\src\main.tsx` | Mobile web/React DOM entry point. |  |
| `frontend mobile\src\pages\Cards.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Cart.tsx` | Mobile app screen/page component or screen-level test. | CHECK USAGE: route presence unclear from current shell |
| `frontend mobile\src\pages\CreadiScoreDashboard.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Credit.test.ts` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Credit.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\EditProfileField.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\EmailVerification.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\FinancialProfile.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\ForgotEmail.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\ForgotPassword.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Home.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Installments.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\KycVerification.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Login.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\NotFound.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Notifications.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\PaymentHistory.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\PersonalInformation.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\ProductDetail.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Profile.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\QRScanner.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Register.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\ShopProducts.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Shops.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\pages\Support.tsx` | Mobile app screen/page component or screen-level test. |  |
| `frontend mobile\src\styles.css` | Mobile web global CSS theme. |  |
| `frontend mobile\src\test\example.test.ts` | Mobile test setup or sample test. | LOW VALUE TEST: sample test may be removable |
| `frontend mobile\src\test\setup.ts` | Mobile test setup or sample test. |  |
| `frontend mobile\src\types\safe-area-context.d.ts` | Mobile TypeScript ambient type declaration. |  |
| `frontend mobile\tailwind.config.ts` | Tailwind configuration for mobile/web styling. |  |
| `frontend mobile\tsconfig.app.json` | TypeScript configuration for mobile app, node tooling, or app code. |  |
| `frontend mobile\tsconfig.json` | TypeScript configuration for mobile app, node tooling, or app code. |  |
| `frontend mobile\tsconfig.node.json` | TypeScript configuration for mobile app, node tooling, or app code. |  |
| `frontend mobile\vitest.config.mjs` | Vitest test runner configuration for mobile frontend tests. |  |
| `frontend mobile\vitest.config.ts` | Vitest test runner configuration for mobile frontend tests. | POSSIBLE DUPLICATE: vitest.config.mjs is used by package script |
| `nulgit` | Stray root file with no clear runtime or documentation role. | ORPHAN: unclear root artifact; likely delete |
| `package-lock.json` | Root npm lockfile without matching root package.json. | REDUNDANT: root lockfile has no root package.json |
| `README.md` | Root project setup and overview documentation. |  |
| `run-logs\backend.err.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\backend.out.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\dashboard.err.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\dashboard.out.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\mobile.err.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\mobile.out.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\socket.err.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `run-logs\socket.out.log` | Runtime log output file generated by local start scripts. | GENERATED: runtime log; should not be versioned; DUPLICATE HASH WITH: .gitignore#, run-logs\backend.err.log, run-logs\backend.out.log, run-logs\dashboard.err.log, run-logs\dashboard.out.log, run-logs\mobile.err.log, run-logs\mobile.out.log, run-logs\socket.err.log, run-logs\socket.out.log |
| `scripts\db\cleanup-test-kyc-users.sql` | SQL schema, reset, migration, or database seed script. |  |
| `scripts\db\kyc-manual-review-migration.sql` | SQL schema, reset, migration, or database seed script. |  |
| `scripts\db\kyc-security-migration.sql` | SQL schema, reset, migration, or database seed script. |  |
| `scripts\db\README-reset.md` | Database maintenance, reset, cleanup, or migration helper. |  |
| `scripts\db\reset-mysql.sql` | SQL schema, reset, migration, or database seed script. |  |
| `scripts\db\reset-postgresql.sql` | SQL schema, reset, migration, or database seed script. | POSSIBLE REDUNDANT: project runtime uses MySQL |
| `scripts\reset-dev-data.ps1` | PowerShell automation script for dev reset or live feature testing. |  |
| `scripts\test-autopay-live.ps1` | PowerShell automation script for dev reset or live feature testing. |  |
| `socket-server\.dockerignore` | Project file; requires deeper semantic review in later audit steps. |  |
| `socket-server\Dockerfile` | Docker image definition for the Socket.IO server. |  |
| `socket-server\index.js` | Socket.IO bridge server that receives backend events and broadcasts realtime notifications. |  |
| `socket-server\package.json` | Socket.IO server npm package manifest or lockfile. |  |
| `socket-server\package-lock.json` | Socket.IO server npm package manifest or lockfile. |  |
| `tmp-kyc-test\img1.png` | PNG image fixture or upload sample used for visual/KYC testing. | TEST FIXTURE: keep only if KYC tests need it |
| `tmp-kyc-test\img2.png` | PNG image fixture or upload sample used for visual/KYC testing. | TEST FIXTURE: keep only if KYC tests need it |
| `tmp-kyc-test\img3.png` | PNG image fixture or upload sample used for visual/KYC testing. | TEST FIXTURE: keep only if KYC tests need it |

## Empty Directories / Folder Issues

- `creaditn (1).sql`: empty directory; review/delete unless intentionally reserved.
- `creadiTn\uploads`: empty directory; review/delete unless intentionally reserved.
- `uploads`: empty directory; review/delete unless intentionally reserved.

## Step 1 Stop Point

Per instruction, audit stops here. No Step 2 database audit, deletion, moving, import update, or large refactor has been performed.

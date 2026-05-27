import type { LocalePreference } from './types';

export const defaultLocale: LocalePreference = 'en-US';

export type TranslationKey =
  | 'nav.home'
  | 'nav.recipes'
  | 'nav.data'
  | 'nav.settings'
  | 'nav.more'
  | 'nav.back'
  | 'nav.backToRun'
  | 'nav.backToRecipes'
  | 'nav.backToHistory'
  | 'nav.backToSettings'
  | 'home.title'
  | 'home.description'
  | 'home.refresh'
  | 'home.currentPage'
  | 'home.active'
  | 'home.compatibleRecipe'
  | 'home.compatibleCount'
  | 'home.runRecipe'
  | 'home.running'
  | 'home.noCompatibleTitle'
  | 'home.noCompatibleDesc'
  | 'home.readyTitle'
  | 'home.readyDesc'
  | 'home.result'
  | 'home.save'
  | 'home.copyJson'
  | 'home.viewData'
  | 'home.viewDetails'
  | 'home.noAlerts'
  | 'home.resultSaved'
  | 'home.jsonCopied'
  | 'home.copyError'
  | 'home.fields'
  | 'home.items'
  | 'home.warnings'
  | 'home.errors'
  | 'home.runField'
  | 'preview.readable'
  | 'preview.json'
  | 'preview.checks'
  | 'preview.copyMarkdown'
  | 'preview.markdownCopied'
  | 'preview.noItems'
  | 'preview.notAvailable'
  | 'status.success'
  | 'status.partial'
  | 'status.error'
  | 'validation.title'
  | 'validation.valid'
  | 'validation.invalid'
  | 'validation.skipped'
  | 'validation.validBadge'
  | 'validation.issuesBadge'
  | 'validation.skippedBadge'
  | 'validation.issue'
  | 'validation.issues'
  | 'validation.moreIssues'
  | 'checks.title'
  | 'checks.add'
  | 'checks.edit'
  | 'checks.new'
  | 'checks.noConfigured'
  | 'checks.allPassed'
  | 'checks.needAttention'
  | 'checks.failed'
  | 'checks.passedBadge'
  | 'checks.noChecksBadge'
  | 'checks.moreChecks'
  | 'checks.showDetails'
  | 'checks.hideDetails'
  | 'checks.expected'
  | 'checks.actual'
  | 'checks.severity'
  | 'checks.targetSelector'
  | 'checks.attribute'
  | 'checks.expectedValue'
  | 'checks.innerSelector'
  | 'checks.assertionType'
  | 'checks.name'
  | 'checks.description'
  | 'checks.info'
  | 'checks.warning'
  | 'checks.error'
  | 'checks.passed'
  | 'checks.warnings'
  | 'checks.errors'
  | 'checks.skipped'
  | 'checks.assertion.exists'
  | 'checks.assertion.notExists'
  | 'checks.assertion.countEquals'
  | 'checks.assertion.countGreaterThan'
  | 'checks.assertion.countGreaterThanOrEqual'
  | 'checks.assertion.countLessThan'
  | 'checks.assertion.countLessThanOrEqual'
  | 'checks.assertion.missingAttributeCountEquals'
  | 'checks.assertion.emptyAttributeCountEquals'
  | 'checks.assertion.eachElementMustHave'
  | 'checks.assertion.eachElementShouldHave'
  | 'batch.single'
  | 'batch.batch'
  | 'batch.batchRun'
  | 'batch.name'
  | 'batch.namePlaceholder'
  | 'batch.urls'
  | 'batch.urlsPlaceholder'
  | 'batch.validUrls'
  | 'batch.invalidUrls'
  | 'batch.duplicatesRemoved'
  | 'batch.paste'
  | 'batch.addUrls'
  | 'batch.removeDuplicates'
  | 'batch.clear'
  | 'batch.addOpenTabs'
  | 'batch.openTabs'
  | 'batch.addSelectedUrls'
  | 'batch.importFile'
  | 'batch.importedUrls'
  | 'batch.duplicatesSkipped'
  | 'batch.invalidUrlsIgnored'
  | 'batch.unsupportedUrls'
  | 'batch.recipes'
  | 'batch.selectedRecipes'
  | 'batch.runOnlyCompatible'
  | 'batch.skipHttpErrorPages'
  | 'batch.skipHttpErrorPagesDescription'
  | 'batch.advancedOptions'
  | 'batch.delayBetweenUrls'
  | 'batch.pageLoadTimeout'
  | 'batch.waitAfterLoad'
  | 'batch.retryFailedUrls'
  | 'batch.whenUrlFails'
  | 'batch.whenRecipeFails'
  | 'batch.saveSuccessfulRuns'
  | 'batch.saveWarningRuns'
  | 'batch.saveFailedRuns'
  | 'batch.processingTabMode'
  | 'batch.plan'
  | 'batch.plannedRuns'
  | 'batch.skippedByCompatibility'
  | 'batch.estimatedDuration'
  | 'batch.start'
  | 'batch.running'
  | 'batch.paused'
  | 'batch.pauseRequested'
  | 'batch.pausingAfterCurrentItem'
  | 'batch.resume'
  | 'batch.resumed'
  | 'batch.pause'
  | 'batch.pauseAction'
  | 'batch.resumeAction'
  | 'batch.stopAction'
  | 'batch.stopped'
  | 'batch.viewProgress'
  | 'batch.currentItem'
  | 'batch.currentUrl'
  | 'batch.currentRecipe'
  | 'batch.viewProcessingTab'
  | 'batch.stop'
  | 'batch.processingTabClosed'
  | 'batch.pausedAvoidLoss'
  | 'batch.resumeInNewTab'
  | 'batch.resumeToContinueInNewTab'
  | 'batch.cancel'
  | 'batch.complete'
  | 'batch.export'
  | 'batch.delete'
  | 'batch.viewRuns'
  | 'batch.startNew'
  | 'batch.allRuns'
  | 'batch.batches'
  | 'batch.noBatches'
  | 'batch.createBatch'
  | 'batch.noCompatibleRecipes'
  | 'batch.httpErrorPage'
  | 'batch.skippedHttpErrorPage'
  | 'batch.httpStatus'
  | 'batch.httpErrorSkippedMessage'
  | 'batch.unsupportedUrl'
  | 'batch.navigationFailed'
  | 'batch.injectionFailed'
  | 'batch.urlsWithNoCompatibleRecipes'
  | 'batch.selectTabsToAdd'
  | 'batch.currentWindowOnly'
  | 'batch.sameDomainAsActiveTab'
  | 'batch.selectAllSupported'
  | 'batch.discovery.discoverUrls'
  | 'batch.discovery.discoverFromActiveTab'
  | 'batch.discovery.description'
  | 'batch.discovery.sourcePage'
  | 'batch.discovery.sameDomainOnly'
  | 'batch.discovery.includePattern'
  | 'batch.discovery.excludePattern'
  | 'batch.discovery.removeDuplicates'
  | 'batch.discovery.removeFragments'
  | 'batch.discovery.normalizeTrailingSlash'
  | 'batch.discovery.maxUrls'
  | 'batch.discovery.runDiscovery'
  | 'batch.discovery.discoveredUrls'
  | 'batch.discovery.addSelectedUrls'
  | 'batch.discovery.searchUrls'
  | 'batch.discovery.selectAll'
  | 'batch.discovery.clearSelection'
  | 'batch.discovery.noLinksFound'
  | 'batch.discovery.noUrlsSelected'
  | 'batch.discovery.unsupportedUrl'
  | 'batch.discovery.externalUrl'
  | 'batch.discovery.duplicate'
  | 'batch.discovery.invalidUrl'
  | 'batch.discovery.excluded'
  | 'batch.discovery.discovered'
  | 'batch.discovery.selected'
  | 'batch.discovery.skipped'
  | 'batch.discovery.scope'
  | 'batch.discovery.filters'
  | 'batch.discovery.cleaning'
  | 'batch.discovery.limit'
  | 'batch.discovery.sensitiveWarning'
  | 'batch.discovery.noActiveTab'
  | 'batch.discovery.permissionError'
  | 'batch.discovery.contentUnavailable'
  | 'batch.cancelled'
  | 'batch.browsingNote'
  | 'batch.keepTabOpen'
  | 'batch.recentEvents'
  | 'batch.successful'
  | 'batch.warningRuns'
  | 'batch.failedRuns'
  | 'batch.skippedRuns'
  | 'batch.duration'
  | 'batch.created'
  | 'batch.completed'
  | 'batch.noRecipesSelected'
  | 'batch.noValidUrls'
  | 'batch.noPlannedRuns'
  | 'batch.resumeLater'
  | 'batch.pausedCurrentItem'
  | 'batch.alreadyActive'
  | 'batch.activeStartBlocked'
  | 'batch.usedByActiveBatch'
  | 'batch.recipeLockedDescription'
  | 'batch.settingsLocked'
  | 'batch.activeRunDeleteBlocked'
  | 'batch.activeBatchDeleteBlocked'
  | 'batch.batchBadge'
  | 'batch.deleteConfirm'
  | 'batch.status.draft'
  | 'batch.status.running'
  | 'batch.status.paused'
  | 'batch.status.completed'
  | 'batch.status.cancelled'
  | 'batch.status.failed'
  | 'batch.onUrlError.stop'
  | 'batch.onUrlError.skip'
  | 'batch.onUrlError.retryThenSkip'
  | 'batch.onRecipeError.stop'
  | 'batch.onRecipeError.skipRecipe'
  | 'batch.onRecipeError.continue'
  | 'settings.title'
  | 'settings.description'
  | 'settings.appearance'
  | 'settings.theme'
  | 'settings.themeHelp'
  | 'settings.system'
  | 'settings.light'
  | 'settings.dark'
  | 'settings.language'
  | 'settings.interfaceLanguage'
  | 'settings.localData'
  | 'settings.extractionDefaults'
  | 'settings.skipHttpErrorPagesDefault'
  | 'settings.skipHttpErrorPagesDefaultDescription'
  | 'settings.recipes'
  | 'settings.savedRuns'
  | 'settings.exportAll'
  | 'settings.clearRuns'
  | 'settings.defaultRecipes'
  | 'settings.defaultRecipesDescription'
  | 'settings.privacy'
  | 'settings.privacyDescription'
  | 'settings.restoreDefaultRecipes'
  | 'settings.clearRunsConfirm'
  | 'settings.runsCleared'
  | 'settings.defaultsRestored'
  | 'settings.exportEmpty'
  | 'settings.english'
  | 'settings.portuguese'
  | 'settings.processingViewport'
  | 'settings.processingViewportDescription'
  | 'settings.viewport.currentWindow'
  | 'settings.viewport.desktop1366'
  | 'settings.viewport.desktop1440'
  | 'settings.viewport.desktop1920'
  | 'settings.viewport.tablet768'
  | 'settings.viewport.mobile390'
  | 'settings.viewport.custom'
  | 'settings.viewport.width'
  | 'settings.viewport.height'
  | 'settings.viewport.label'
  | 'settings.viewport.notRecorded'
  | 'settings.viewport.invalid'
  | 'settings.viewport.newWindowHint'
  | 'common.all'
  | 'common.local'
  | 'recipe.category.seo'
  | 'recipe.category.metadata'
  | 'recipe.category.structured-data'
  | 'recipe.category.content'
  | 'recipe.category.ecommerce'
  | 'recipe.category.links'
  | 'recipe.category.images'
  | 'recipe.category.social'
  | 'recipe.category.qa'
  | 'recipe.category.custom'
  | 'recipe.source.default'
  | 'recipe.source.user'
  | 'recipe.source.imported'
  | 'recipe.source.gallery'
  | 'recipes.title'
  | 'recipes.description'
  | 'recipes.importing'
  | 'recipes.import'
  | 'recipes.new'
  | 'recipes.someNotImported'
  | 'recipes.noneImported'
  | 'recipes.importedCount'
  | 'recipes.emptyTitle'
  | 'recipes.emptyDesc'
  | 'recipes.create'
  | 'recipes.noMatchTitle'
  | 'recipes.noMatchDesc'
  | 'recipes.noDesc'
  | 'recipes.fields'
  | 'recipes.patterns'
  | 'recipes.edit'
  | 'recipes.duplicate'
  | 'recipes.export'
  | 'recipes.delete'
  | 'recipes.deleteConfirm'
  | 'recipes.category'
  | 'recipes.tags'
  | 'recipes.search'
  | 'recipes.allWebsites'
  | 'form.definition'
  | 'form.editRecipe'
  | 'form.newRecipe'
  | 'form.name'
  | 'form.namePlaceholder'
  | 'form.description'
  | 'form.version'
  | 'form.urlPatterns'
  | 'form.save'
  | 'form.cancel'
  | 'form.nameRequired'
  | 'form.fieldsRequired'
  | 'form.fieldsOrChecksRequired'
  | 'field.mode.single'
  | 'field.mode.list'
  | 'field.mode.group'
  | 'field.duplicate'
  | 'field.delete'
  | 'field.jsonKey'
  | 'field.selector'
  | 'field.required'
  | 'field.extract'
  | 'field.attribute'
  | 'field.transforms'
  | 'field.itemFields'
  | 'field.add'
  | 'field.addField'
  | 'extract.text'
  | 'extract.html'
  | 'extract.attribute'
  | 'extract.json'
  | 'extract.exists'
  | 'extract.count'
  | 'extract.tagName'
  | 'transform.trim'
  | 'transform.removeExtraSpaces'
  | 'transform.lowercase'
  | 'transform.uppercase'
  | 'transform.number'
  | 'transform.currency'
  | 'transform.absoluteUrl'
  | 'transform.jsonParse'
  | 'data.title'
  | 'data.description'
  | 'data.exportAll'
  | 'data.saved'
  | 'data.filters'
  | 'data.recipe'
  | 'data.domain'
  | 'data.url'
  | 'data.filterUrl'
  | 'data.select'
  | 'data.clear'
  | 'data.exportSelected'
  | 'data.selectedLabel'
  | 'data.viewJson'
  | 'data.viewDetails'
  | 'data.selectRun'
  | 'data.emptyTitle'
  | 'data.emptyDesc'
  | 'data.close'
  | 'data.deleteConfirm'
  | 'toast.close'
  | 'toast.recipeSaved'
  | 'toast.recipeDeleted'
  | 'toast.recipeDuplicated'
  | 'toast.exported'
  | 'toast.exportFailed'
  | 'onboarding.welcomeTitle'
  | 'onboarding.welcomeSubtitle'
  | 'onboarding.welcomeHint1'
  | 'onboarding.welcomeHint2'
  | 'onboarding.welcomeHint3'
  | 'onboarding.getStarted'
  | 'onboarding.skip'
  | 'onboarding.starterTitle'
  | 'onboarding.starterSubtitle'
  | 'onboarding.installSelected'
  | 'onboarding.installRecommended'
  | 'onboarding.skipForNow'
  | 'onboarding.back'
  | 'settings.starterSetup'
  | 'settings.starterSetupDescription'
  | 'settings.runSetupAgain'
  | 'toast.starterInstalled'
  | 'toast.setupSkipped';

type Dictionary = Record<TranslationKey, string>;

export const dictionaries: Record<LocalePreference, Dictionary> = {
  'en-US': {
    'nav.home': 'Run',
    'nav.recipes': 'Recipes',
    'nav.data': 'History',
    'nav.settings': 'Settings',
    'nav.more': 'More',
    'nav.back': 'Back',
    'nav.backToRun': 'Back to Run',
    'nav.backToRecipes': 'Back to Recipes',
    'nav.backToHistory': 'Back to History',
    'nav.backToSettings': 'Back to Settings',
    'home.title': 'Run',
    'home.description': 'Choose a compatible recipe and extract structured JSON from the active tab.',
    'home.refresh': 'Refresh',
    'home.currentPage': 'Current Page',
    'home.active': 'Active',
    'home.compatibleRecipe': 'Matched Recipe',
    'home.compatibleCount': 'compatible for this URL',
    'home.runRecipe': 'Run recipe',
    'home.running': 'Running...',
    'home.noCompatibleTitle': 'No compatible recipes',
    'home.noCompatibleDesc': 'Create a recipe or adjust URL patterns in Recipes.',
    'home.readyTitle': 'No output yet',
    'home.readyDesc': 'Run a recipe to preview JSON, warnings, validation and execution time.',
    'home.result': 'Extraction Result',
    'home.save': 'Save',
    'home.copyJson': 'Copy JSON',
    'home.viewData': 'View JSON',
    'home.viewDetails': 'View details',
    'home.noAlerts': 'No alerts',
    'home.resultSaved': 'Result saved.',
    'home.jsonCopied': 'JSON copied.',
    'home.copyError': 'Could not copy.',
    'home.fields': 'fields',
    'home.items': 'items',
    'home.warnings': 'Warnings',
    'home.errors': 'Errors',
    'home.runField': 'run',
    'preview.readable': 'Readable',
    'preview.json': 'JSON',
    'preview.checks': 'Checks',
    'preview.copyMarkdown': 'Copy Markdown',
    'preview.markdownCopied': 'Markdown copied.',
    'preview.noItems': 'No items.',
    'preview.notAvailable': 'Not available',
    'status.success': 'OK',
    'status.partial': 'Partial',
    'status.error': 'Error',
    'validation.title': 'Output validation',
    'validation.valid': 'Valid output',
    'validation.invalid': 'Output has issues',
    'validation.skipped': 'Validation skipped',
    'validation.validBadge': 'Valid',
    'validation.issuesBadge': 'Issues',
    'validation.skippedBadge': 'Skipped',
    'validation.issue': 'issue',
    'validation.issues': 'issues',
    'validation.moreIssues': 'more issues',
    'checks.title': 'Checks',
    'checks.add': 'Add check',
    'checks.edit': 'Edit check',
    'checks.new': 'New check',
    'checks.noConfigured': 'No checks configured',
    'checks.allPassed': 'All checks passed',
    'checks.needAttention': 'Checks need attention',
    'checks.failed': 'Checks failed',
    'checks.passedBadge': 'Checks passed',
    'checks.noChecksBadge': 'No checks',
    'checks.moreChecks': 'more checks',
    'checks.showDetails': 'Show checks',
    'checks.hideDetails': 'Hide checks',
    'checks.expected': 'Expected',
    'checks.actual': 'Actual',
    'checks.severity': 'Severity',
    'checks.targetSelector': 'Target selector',
    'checks.attribute': 'Attribute',
    'checks.expectedValue': 'Expected value',
    'checks.innerSelector': 'Inner selector',
    'checks.assertionType': 'Check type',
    'checks.name': 'Name',
    'checks.description': 'Description',
    'checks.info': 'Info',
    'checks.warning': 'Warning',
    'checks.error': 'Error',
    'checks.passed': 'passed',
    'checks.warnings': 'warnings',
    'checks.errors': 'errors',
    'checks.skipped': 'skipped',
    'checks.assertion.exists': 'Element must exist',
    'checks.assertion.notExists': 'Element must not exist',
    'checks.assertion.countEquals': 'Count must equal',
    'checks.assertion.countGreaterThan': 'Count must be greater than',
    'checks.assertion.countGreaterThanOrEqual': 'Count must be greater than or equal',
    'checks.assertion.countLessThan': 'Count must be less than',
    'checks.assertion.countLessThanOrEqual': 'Count must be less than or equal',
    'checks.assertion.missingAttributeCountEquals': 'Missing attribute count must equal',
    'checks.assertion.emptyAttributeCountEquals': 'Empty attribute count must equal',
    'checks.assertion.eachElementMustHave': 'Each item must contain selector',
    'checks.assertion.eachElementShouldHave': 'Each item should contain selector',
    'batch.single': 'Single',
    'batch.batch': 'Batch',
    'batch.batchRun': 'Batch run',
    'batch.name': 'Batch name',
    'batch.namePlaceholder': 'My extraction batch',
    'batch.urls': 'URLs',
    'batch.urlsPlaceholder': 'One URL per line',
    'batch.validUrls': 'Valid URLs',
    'batch.invalidUrls': 'Invalid URLs',
    'batch.duplicatesRemoved': 'duplicates removed',
    'batch.paste': 'Paste from clipboard',
    'batch.addUrls': 'Add URLs',
    'batch.removeDuplicates': 'Remove duplicates',
    'batch.clear': 'Clear',
    'batch.addOpenTabs': 'Add open tabs',
    'batch.openTabs': 'Open tabs',
    'batch.addSelectedUrls': 'Add selected URLs',
    'batch.importFile': 'Import file',
    'batch.importedUrls': 'Imported URLs',
    'batch.duplicatesSkipped': 'Duplicates skipped',
    'batch.invalidUrlsIgnored': 'Invalid URLs ignored',
    'batch.unsupportedUrls': 'Unsupported URLs',
    'batch.recipes': 'Recipes',
    'batch.selectedRecipes': 'Selected recipes',
    'batch.runOnlyCompatible': 'Run only compatible recipes for each URL',
    'batch.skipHttpErrorPages': 'Skip HTTP error pages',
    'batch.skipHttpErrorPagesDescription': 'Skip extraction when a page appears to return an HTTP error status.',
    'batch.advancedOptions': 'Advanced options',
    'batch.delayBetweenUrls': 'Delay between URLs',
    'batch.pageLoadTimeout': 'Page load timeout',
    'batch.waitAfterLoad': 'Wait after page load',
    'batch.retryFailedUrls': 'Retry failed URLs',
    'batch.whenUrlFails': 'When a URL fails',
    'batch.whenRecipeFails': 'When a recipe fails',
    'batch.saveSuccessfulRuns': 'Save successful runs',
    'batch.saveWarningRuns': 'Save runs with warnings',
    'batch.saveFailedRuns': 'Save failed runs',
    'batch.processingTabMode': 'Use one pinned processing tab',
    'batch.plan': 'Preview plan',
    'batch.plannedRuns': 'Planned runs',
    'batch.skippedByCompatibility': 'Skipped by compatibility',
    'batch.estimatedDuration': 'Estimated duration',
    'batch.start': 'Start batch',
    'batch.running': 'Batch running',
    'batch.paused': 'Batch paused',
    'batch.pauseRequested': 'Batch pause requested',
    'batch.pausingAfterCurrentItem': 'Pausing after current item',
    'batch.resume': 'Resume batch',
    'batch.resumed': 'Batch resumed',
    'batch.pause': 'Pause batch',
    'batch.pauseAction': 'Pause',
    'batch.resumeAction': 'Resume',
    'batch.stopAction': 'Stop',
    'batch.stopped': 'Batch stopped',
    'batch.viewProgress': 'View progress',
    'batch.currentItem': 'Current',
    'batch.currentUrl': 'Current URL',
    'batch.currentRecipe': 'Current recipe',
    'batch.viewProcessingTab': 'View processing tab',
    'batch.stop': 'Stop batch',
    'batch.processingTabClosed': 'Processing tab was closed',
    'batch.pausedAvoidLoss': 'Batch paused to avoid losing progress.',
    'batch.resumeInNewTab': 'Resume in new tab',
    'batch.resumeToContinueInNewTab': 'Resume to continue in a new tab.',
    'batch.cancel': 'Cancel batch',
    'batch.complete': 'Batch complete',
    'batch.export': 'Export batch',
    'batch.delete': 'Delete batch',
    'batch.viewRuns': 'View runs',
    'batch.startNew': 'Start new batch',
    'batch.allRuns': 'All runs',
    'batch.batches': 'Batches',
    'batch.noBatches': 'No batch runs yet',
    'batch.createBatch': 'Create batch run',
    'batch.noCompatibleRecipes': 'No compatible recipes',
    'batch.httpErrorPage': 'HTTP error page',
    'batch.skippedHttpErrorPage': 'Skipped HTTP error page',
    'batch.httpStatus': 'HTTP status',
    'batch.httpErrorSkippedMessage': 'Page skipped because HTTP error pages are disabled',
    'batch.unsupportedUrl': 'Unsupported URL',
    'batch.navigationFailed': 'Navigation failed',
    'batch.injectionFailed': 'Content script injection failed',
    'batch.urlsWithNoCompatibleRecipes': 'URLs with no compatible recipes',
    'batch.selectTabsToAdd': 'Select tabs to add',
    'batch.currentWindowOnly': 'Current window only',
    'batch.sameDomainAsActiveTab': 'Same domain as active tab',
    'batch.selectAllSupported': 'Select all supported',
    'batch.discovery.discoverUrls': 'Discover URLs',
    'batch.discovery.discoverFromActiveTab': 'Discover from active tab',
    'batch.discovery.description': 'Find links already present in the active tab.',
    'batch.discovery.sourcePage': 'Source page',
    'batch.discovery.sameDomainOnly': 'Same domain only',
    'batch.discovery.includePattern': 'Include pattern',
    'batch.discovery.excludePattern': 'Exclude pattern',
    'batch.discovery.removeDuplicates': 'Remove duplicates',
    'batch.discovery.removeFragments': 'Remove fragments',
    'batch.discovery.normalizeTrailingSlash': 'Normalize trailing slash',
    'batch.discovery.maxUrls': 'Max URLs',
    'batch.discovery.runDiscovery': 'Run discovery',
    'batch.discovery.discoveredUrls': 'Discovered URLs',
    'batch.discovery.addSelectedUrls': 'Add selected URLs',
    'batch.discovery.searchUrls': 'Search URLs',
    'batch.discovery.selectAll': 'Select all',
    'batch.discovery.clearSelection': 'Clear selection',
    'batch.discovery.noLinksFound': 'No links found',
    'batch.discovery.noUrlsSelected': 'No URLs selected',
    'batch.discovery.unsupportedUrl': 'Unsupported URL',
    'batch.discovery.externalUrl': 'External URL',
    'batch.discovery.duplicate': 'Duplicate',
    'batch.discovery.invalidUrl': 'Invalid URL',
    'batch.discovery.excluded': 'Excluded',
    'batch.discovery.discovered': 'Discovered',
    'batch.discovery.selected': 'Selected',
    'batch.discovery.skipped': 'Skipped',
    'batch.discovery.scope': 'Scope',
    'batch.discovery.filters': 'Filters',
    'batch.discovery.cleaning': 'Cleaning',
    'batch.discovery.limit': 'Limit',
    'batch.discovery.sensitiveWarning':
      'This page may contain private content. Only discover URLs here if you trust the page context.',
    'batch.discovery.noActiveTab': 'No active tab found.',
    'batch.discovery.permissionError': 'Could not read links from the active tab.',
    'batch.discovery.contentUnavailable': 'Could not connect to the active tab. Reload the page and try again.',
    'batch.cancelled': 'Batch cancelled',
    'batch.browsingNote': 'You can keep browsing in other tabs while the batch runs.',
    'batch.keepTabOpen': 'Keep the processing tab open while the batch is running.',
    'batch.recentEvents': 'Recent events',
    'batch.successful': 'Successful',
    'batch.warningRuns': 'Warnings',
    'batch.failedRuns': 'Failed',
    'batch.skippedRuns': 'Skipped',
    'batch.duration': 'Duration',
    'batch.created': 'Created',
    'batch.completed': 'Completed',
    'batch.noRecipesSelected': 'Select at least one recipe.',
    'batch.noValidUrls': 'Add at least one valid URL.',
    'batch.noPlannedRuns': 'No planned runs.',
    'batch.resumeLater': 'You can resume this batch later. ExtractKit will continue from the next pending item.',
    'batch.pausedCurrentItem': 'Paused after current item. You can resume later.',
    'batch.alreadyActive': 'A batch is already running or paused.',
    'batch.activeStartBlocked': 'Finish, resume, or stop it before starting another one.',
    'batch.usedByActiveBatch': 'Used by active batch',
    'batch.recipeLockedDescription':
      'This recipe is being used by an active batch. Pause or stop the batch before editing it.',
    'batch.settingsLocked': 'Some settings are locked while a batch is running.',
    'batch.activeRunDeleteBlocked': 'This run belongs to an active batch and cannot be deleted yet.',
    'batch.activeBatchDeleteBlocked': 'This batch is active and cannot be deleted yet.',
    'batch.batchBadge': 'Batch',
    'batch.deleteConfirm': 'Delete this batch record? Saved runs will be kept.',
    'batch.status.draft': 'Draft',
    'batch.status.running': 'Batch running',
    'batch.status.paused': 'Batch paused',
    'batch.status.completed': 'Batch completed',
    'batch.status.cancelled': 'Batch cancelled',
    'batch.status.failed': 'Batch failed',
    'batch.onUrlError.stop': 'Stop batch',
    'batch.onUrlError.skip': 'Skip URL',
    'batch.onUrlError.retryThenSkip': 'Retry, then skip',
    'batch.onRecipeError.stop': 'Stop batch',
    'batch.onRecipeError.skipRecipe': 'Skip recipe',
    'batch.onRecipeError.continue': 'Continue',
    'settings.title': 'Settings',
    'settings.description': 'Customize ExtractKit for your local workflow.',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.themeHelp': 'Follow your system theme or force a local preference.',
    'settings.system': 'System',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.language': 'Language',
    'settings.interfaceLanguage': 'Interface language',
    'settings.localData': 'Local data',
    'settings.extractionDefaults': 'Extraction defaults',
    'settings.skipHttpErrorPagesDefault': 'Skip HTTP error pages by default',
    'settings.skipHttpErrorPagesDefaultDescription':
      'Avoid extracting pages that appear to return HTTP errors such as 404 or 500 during batch runs.',
    'settings.recipes': 'Recipes',
    'settings.savedRuns': 'Saved history',
    'settings.exportAll': 'Export all',
    'settings.clearRuns': 'Clear history',
    'settings.defaultRecipes': 'Default recipes',
    'settings.defaultRecipesDescription': 'Restore universal starter recipes.',
    'settings.privacy': 'Privacy',
    'settings.privacyDescription': 'Recipes, preferences and saved runs stay in chrome.storage.local on this browser.',
    'settings.restoreDefaultRecipes': 'Restore default recipes',
    'settings.clearRunsConfirm': 'Clear all saved history? Recipes will be kept.',
    'settings.runsCleared': 'Saved history cleared.',
    'settings.defaultsRestored': 'Default recipes restored.',
    'settings.exportEmpty': 'No saved history to export.',
    'settings.english': 'English',
    'settings.portuguese': 'Português (Brasil)',
    'settings.processingViewport': 'Processing viewport',
    'settings.processingViewportDescription': 'Choose the viewport size used during batch extraction.',
    'settings.viewport.currentWindow': 'Use current window size',
    'settings.viewport.desktop1366': 'Desktop 1366 × 768',
    'settings.viewport.desktop1440': 'Desktop 1440 × 900',
    'settings.viewport.desktop1920': 'Desktop 1920 × 1080',
    'settings.viewport.tablet768': 'Tablet 768 × 1024',
    'settings.viewport.mobile390': 'Mobile 390 × 844',
    'settings.viewport.custom': 'Custom',
    'settings.viewport.width': 'Width',
    'settings.viewport.height': 'Height',
    'settings.viewport.label': 'Viewport',
    'settings.viewport.notRecorded': 'Viewport not recorded',
    'settings.viewport.invalid': 'Invalid viewport size',
    'settings.viewport.newWindowHint': 'A separate browser window will be opened for batch runs.',
    'common.all': 'All',
    'common.local': 'local',
    'recipe.category.seo': 'SEO',
    'recipe.category.metadata': 'Metadata',
    'recipe.category.structured-data': 'Structured Data',
    'recipe.category.content': 'Content',
    'recipe.category.ecommerce': 'E-commerce',
    'recipe.category.links': 'Links',
    'recipe.category.images': 'Images',
    'recipe.category.social': 'Social',
    'recipe.category.qa': 'QA',
    'recipe.category.custom': 'Custom',
    'recipe.source.default': 'Default',
    'recipe.source.user': 'User',
    'recipe.source.imported': 'Imported',
    'recipe.source.gallery': 'Gallery',
    'recipes.title': 'Recipes',
    'recipes.description': 'Local library of selectors and transformations.',
    'recipes.importing': 'Importing...',
    'recipes.import': 'Import',
    'recipes.new': 'New Recipe',
    'recipes.someNotImported': 'Some files were not imported.',
    'recipes.noneImported': 'No recipe was imported.',
    'recipes.importedCount': 'recipe(s) imported.',
    'recipes.emptyTitle': 'No recipes',
    'recipes.emptyDesc': 'Import a .recipe.json file or create a local recipe to get started.',
    'recipes.create': 'Create recipe',
    'recipes.noMatchTitle': 'No matching recipes',
    'recipes.noMatchDesc': 'Try another search term or category.',
    'recipes.noDesc': 'No description',
    'recipes.fields': 'fields',
    'recipes.patterns': 'patterns',
    'recipes.edit': 'Edit',
    'recipes.duplicate': 'Duplicate',
    'recipes.export': 'Export',
    'recipes.delete': 'Delete',
    'recipes.deleteConfirm': 'Delete recipe',
    'recipes.category': 'Category',
    'recipes.tags': 'Tags',
    'recipes.search': 'Search recipes...',
    'recipes.allWebsites': 'All websites',
    'form.definition': 'Definition',
    'form.editRecipe': 'Edit recipe',
    'form.newRecipe': 'New recipe',
    'form.name': 'Name',
    'form.namePlaceholder': 'E-commerce product',
    'form.description': 'Description',
    'form.version': 'Version',
    'form.urlPatterns': 'Compatible URLs',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.nameRequired': 'Enter a recipe name.',
    'form.fieldsRequired': 'Add at least one field.',
    'form.fieldsOrChecksRequired': 'Add at least one field or check.',
    'field.mode.single': 'Single value',
    'field.mode.list': 'Simple list',
    'field.mode.group': 'Item list',
    'field.duplicate': 'Duplicate',
    'field.delete': 'Delete',
    'field.jsonKey': 'JSON key',
    'field.selector': 'CSS selector',
    'field.required': 'Required',
    'field.extract': 'Extract',
    'field.attribute': 'Attribute',
    'field.transforms': 'Transforms',
    'field.itemFields': 'Item fields',
    'field.add': 'Add',
    'field.addField': 'Add field',
    'extract.text': 'Text',
    'extract.html': 'HTML',
    'extract.attribute': 'Attribute',
    'extract.json': 'JSON',
    'extract.exists': 'Exists',
    'extract.count': 'Count',
    'extract.tagName': 'Tag name',
    'transform.trim': 'Trim',
    'transform.removeExtraSpaces': 'Extra spaces',
    'transform.lowercase': 'Lowercase',
    'transform.uppercase': 'Uppercase',
    'transform.number': 'Number',
    'transform.currency': 'Currency',
    'transform.absoluteUrl': 'Absolute URL',
    'transform.jsonParse': 'Parse JSON',
    'data.title': 'History',
    'data.description': 'Local history of saved runs.',
    'data.exportAll': 'Export all',
    'data.saved': 'saved',
    'data.filters': 'Filters',
    'data.recipe': 'Recipe',
    'data.domain': 'Domain',
    'data.url': 'URL',
    'data.filterUrl': 'Search URL',
    'data.select': 'Select',
    'data.clear': 'Clear',
    'data.exportSelected': 'Export selected',
    'data.selectedLabel': 'selected',
    'data.viewJson': 'View JSON',
    'data.viewDetails': 'View details',
    'data.selectRun': 'Select run',
    'data.emptyTitle': 'No saved runs',
    'data.emptyDesc': 'Run and save results from Run to fill this log.',
    'data.close': 'Close',
    'data.deleteConfirm': 'Delete this run?',
    'toast.close': 'Close',
    'toast.recipeSaved': 'Recipe saved.',
    'toast.recipeDeleted': 'Recipe deleted.',
    'toast.recipeDuplicated': 'Recipe duplicated.',
    'toast.exported': 'Export completed.',
    'toast.exportFailed': 'Export failed.',
    'onboarding.welcomeTitle': 'Welcome to ExtractKit',
    'onboarding.welcomeSubtitle': 'Turn web pages into structured JSON with reusable extraction recipes.',
    'onboarding.welcomeHint1': 'Recipes define what to extract from a page.',
    'onboarding.welcomeHint2': 'Runs execute recipes on the active tab.',
    'onboarding.welcomeHint3': 'Results stay local in your browser.',
    'onboarding.getStarted': 'Get started',
    'onboarding.skip': 'Skip setup',
    'onboarding.starterTitle': 'Choose starter recipes',
    'onboarding.starterSubtitle': 'Install a few local recipes to start extracting data right away.',
    'onboarding.installSelected': 'Install selected recipes',
    'onboarding.installRecommended': 'Install recommended',
    'onboarding.skipForNow': 'Skip for now',
    'onboarding.back': 'Back',
    'settings.starterSetup': 'Starter setup',
    'settings.starterSetupDescription': 'Choose or restore starter recipes for this browser.',
    'settings.runSetupAgain': 'Run setup again',
    'toast.starterInstalled': 'Starter recipes installed.',
    'toast.setupSkipped': 'Setup skipped.'
  },
  'pt-BR': {
    'nav.home': 'Execução',
    'nav.recipes': 'Receitas',
    'nav.data': 'Histórico',
    'nav.settings': 'Configurações',
    'nav.more': 'Mais',
    'nav.back': 'Voltar',
    'nav.backToRun': 'Voltar para Executar',
    'nav.backToRecipes': 'Voltar para Receitas',
    'nav.backToHistory': 'Voltar para Histórico',
    'nav.backToSettings': 'Voltar para Configurações',
    'home.title': 'Execução',
    'home.description': 'Escolha uma receita compatível e extraia JSON estruturado da aba ativa.',
    'home.refresh': 'Atualizar',
    'home.currentPage': 'Página Atual',
    'home.active': 'Ativa',
    'home.compatibleRecipe': 'Receita Encontrada',
    'home.compatibleCount': 'compatível(is) para esta URL',
    'home.runRecipe': 'Executar receita',
    'home.running': 'Executando...',
    'home.noCompatibleTitle': 'Nenhuma receita compatível',
    'home.noCompatibleDesc': 'Crie uma receita ou ajuste os padrões de URL em Receitas.',
    'home.readyTitle': 'Nenhuma saída ainda',
    'home.readyDesc': 'Execute uma receita para visualizar JSON, alertas, validação e tempo de execução.',
    'home.result': 'Resultado da Extração',
    'home.save': 'Salvar',
    'home.copyJson': 'Copiar JSON',
    'home.viewData': 'Ver JSON',
    'home.viewDetails': 'Ver detalhes',
    'home.noAlerts': 'sem alertas',
    'home.resultSaved': 'Resultado salvo.',
    'home.jsonCopied': 'JSON copiado.',
    'home.copyError': 'Não foi possível copiar.',
    'home.fields': 'campos',
    'home.items': 'itens',
    'home.warnings': 'Alertas',
    'home.errors': 'Erros',
    'home.runField': 'execução',
    'preview.readable': 'Legível',
    'preview.json': 'JSON',
    'preview.checks': 'Checks',
    'preview.copyMarkdown': 'Copiar Markdown',
    'preview.markdownCopied': 'Markdown copiado.',
    'preview.noItems': 'Nenhum item.',
    'preview.notAvailable': 'Não disponível',
    'status.success': 'OK',
    'status.partial': 'Parcial',
    'status.error': 'Erro',
    'validation.title': 'Validação do resultado',
    'validation.valid': 'Resultado válido',
    'validation.invalid': 'Resultado com problemas',
    'validation.skipped': 'Validação ignorada',
    'validation.validBadge': 'Válido',
    'validation.issuesBadge': 'Problemas',
    'validation.skippedBadge': 'Ignorada',
    'validation.issue': 'problema',
    'validation.issues': 'problemas',
    'validation.moreIssues': 'mais problemas',
    'checks.title': 'Checks',
    'checks.add': 'Adicionar check',
    'checks.edit': 'Editar check',
    'checks.new': 'Novo check',
    'checks.noConfigured': 'Nenhum check configurado',
    'checks.allPassed': 'Todos os checks passaram',
    'checks.needAttention': 'Checks precisam de atenção',
    'checks.failed': 'Checks falharam',
    'checks.passedBadge': 'Checks passaram',
    'checks.noChecksBadge': 'Sem checks',
    'checks.moreChecks': 'checks a mais',
    'checks.showDetails': 'Mostrar checks',
    'checks.hideDetails': 'Ocultar checks',
    'checks.expected': 'Esperado',
    'checks.actual': 'Atual',
    'checks.severity': 'Severidade',
    'checks.targetSelector': 'Seletor alvo',
    'checks.attribute': 'Atributo',
    'checks.expectedValue': 'Valor esperado',
    'checks.innerSelector': 'Seletor interno',
    'checks.assertionType': 'Tipo do check',
    'checks.name': 'Nome',
    'checks.description': 'Descrição',
    'checks.info': 'Info',
    'checks.warning': 'Aviso',
    'checks.error': 'Erro',
    'checks.passed': 'passaram',
    'checks.warnings': 'avisos',
    'checks.errors': 'erros',
    'checks.skipped': 'ignorados',
    'checks.assertion.exists': 'Elemento deve existir',
    'checks.assertion.notExists': 'Elemento não deve existir',
    'checks.assertion.countEquals': 'Contagem deve ser igual a',
    'checks.assertion.countGreaterThan': 'Contagem deve ser maior que',
    'checks.assertion.countGreaterThanOrEqual': 'Contagem deve ser maior ou igual a',
    'checks.assertion.countLessThan': 'Contagem deve ser menor que',
    'checks.assertion.countLessThanOrEqual': 'Contagem deve ser menor ou igual a',
    'checks.assertion.missingAttributeCountEquals': 'Contagem de atributo ausente deve ser igual a',
    'checks.assertion.emptyAttributeCountEquals': 'Contagem de atributo vazio deve ser igual a',
    'checks.assertion.eachElementMustHave': 'Cada item deve conter seletor',
    'checks.assertion.eachElementShouldHave': 'Cada item deveria conter seletor',
    'batch.single': 'Individual',
    'batch.batch': 'Lote',
    'batch.batchRun': 'Execução em lote',
    'batch.name': 'Nome do lote',
    'batch.namePlaceholder': 'Meu lote de extração',
    'batch.urls': 'URLs',
    'batch.urlsPlaceholder': 'Uma URL por linha',
    'batch.validUrls': 'URLs válidas',
    'batch.invalidUrls': 'URLs inválidas',
    'batch.duplicatesRemoved': 'duplicadas removidas',
    'batch.paste': 'Colar da área de transferência',
    'batch.addUrls': 'Adicionar URLs',
    'batch.removeDuplicates': 'Remover duplicadas',
    'batch.clear': 'Limpar',
    'batch.addOpenTabs': 'Adicionar abas abertas',
    'batch.openTabs': 'Abas abertas',
    'batch.addSelectedUrls': 'Adicionar URLs selecionadas',
    'batch.importFile': 'Importar arquivo',
    'batch.importedUrls': 'URLs importadas',
    'batch.duplicatesSkipped': 'Duplicadas ignoradas',
    'batch.invalidUrlsIgnored': 'URLs inválidas ignoradas',
    'batch.unsupportedUrls': 'URLs não suportadas',
    'batch.recipes': 'Receitas',
    'batch.selectedRecipes': 'Receitas selecionadas',
    'batch.runOnlyCompatible': 'Rodar apenas receitas compatíveis para cada URL',
    'batch.skipHttpErrorPages': 'Ignorar páginas com erro HTTP',
    'batch.skipHttpErrorPagesDescription':
      'Ignore a extração quando uma página parece retornar um status de erro HTTP.',
    'batch.advancedOptions': 'Opções avançadas',
    'batch.delayBetweenUrls': 'Intervalo entre URLs',
    'batch.pageLoadTimeout': 'Timeout de carregamento da página',
    'batch.waitAfterLoad': 'Esperar após carregamento',
    'batch.retryFailedUrls': 'Tentar URLs com erro novamente',
    'batch.whenUrlFails': 'Quando uma URL falhar',
    'batch.whenRecipeFails': 'Quando uma receita falhar',
    'batch.saveSuccessfulRuns': 'Salvar execuções com sucesso',
    'batch.saveWarningRuns': 'Salvar execuções com alertas',
    'batch.saveFailedRuns': 'Salvar execuções com falha',
    'batch.processingTabMode': 'Usar uma aba fixada de processamento',
    'batch.plan': 'Prévia do plano',
    'batch.plannedRuns': 'Execuções planejadas',
    'batch.skippedByCompatibility': 'Ignoradas por compatibilidade',
    'batch.estimatedDuration': 'Duração estimada',
    'batch.start': 'Iniciar lote',
    'batch.running': 'Lote em execução',
    'batch.paused': 'Lote pausado',
    'batch.pauseRequested': 'Pausa do lote solicitada',
    'batch.pausingAfterCurrentItem': 'Pausando após o item atual',
    'batch.resume': 'Retomar lote',
    'batch.resumed': 'Lote retomado',
    'batch.pause': 'Pausar lote',
    'batch.pauseAction': 'Pausar',
    'batch.resumeAction': 'Retomar',
    'batch.stopAction': 'Parar',
    'batch.stopped': 'Lote parado',
    'batch.viewProgress': 'Ver progresso',
    'batch.currentItem': 'Atual',
    'batch.currentUrl': 'URL atual',
    'batch.currentRecipe': 'Receita atual',
    'batch.viewProcessingTab': 'Ver aba de processamento',
    'batch.stop': 'Parar lote',
    'batch.processingTabClosed': 'A aba de processamento foi fechada',
    'batch.pausedAvoidLoss': 'O lote foi pausado para evitar perda de progresso.',
    'batch.resumeInNewTab': 'Retomar em nova aba',
    'batch.resumeToContinueInNewTab': 'Retome para continuar em uma nova aba.',
    'batch.cancel': 'Cancelar lote',
    'batch.complete': 'Lote concluído',
    'batch.export': 'Exportar lote',
    'batch.delete': 'Excluir lote',
    'batch.viewRuns': 'Ver execuções',
    'batch.startNew': 'Iniciar novo lote',
    'batch.allRuns': 'Todas as execuções',
    'batch.batches': 'Lotes',
    'batch.noBatches': 'Nenhum lote ainda',
    'batch.createBatch': 'Criar execução em lote',
    'batch.noCompatibleRecipes': 'Nenhuma receita compatível',
    'batch.httpErrorPage': 'Página com erro HTTP',
    'batch.skippedHttpErrorPage': 'Página com erro HTTP ignorada',
    'batch.httpStatus': 'Status HTTP',
    'batch.httpErrorSkippedMessage': 'Página ignorada porque páginas com erro HTTP estão desativadas',
    'batch.unsupportedUrl': 'URL não suportada',
    'batch.navigationFailed': 'Falha de navegação',
    'batch.injectionFailed': 'Falha ao injetar content script',
    'batch.urlsWithNoCompatibleRecipes': 'URLs sem receitas compatíveis',
    'batch.selectTabsToAdd': 'Selecione abas para adicionar',
    'batch.currentWindowOnly': 'Apenas janela atual',
    'batch.sameDomainAsActiveTab': 'Mesmo domínio da aba ativa',
    'batch.selectAllSupported': 'Selecionar todas suportadas',
    'batch.discovery.discoverUrls': 'Descobrir URLs',
    'batch.discovery.discoverFromActiveTab': 'Descobrir da aba ativa',
    'batch.discovery.description': 'Encontre links já presentes na aba ativa.',
    'batch.discovery.sourcePage': 'Página de origem',
    'batch.discovery.sameDomainOnly': 'Apenas mesmo domínio',
    'batch.discovery.includePattern': 'Padrão de inclusão',
    'batch.discovery.excludePattern': 'Padrão de exclusão',
    'batch.discovery.removeDuplicates': 'Remover duplicadas',
    'batch.discovery.removeFragments': 'Remover fragmentos',
    'batch.discovery.normalizeTrailingSlash': 'Normalizar barra final',
    'batch.discovery.maxUrls': 'Máximo de URLs',
    'batch.discovery.runDiscovery': 'Executar descoberta',
    'batch.discovery.discoveredUrls': 'URLs descobertas',
    'batch.discovery.addSelectedUrls': 'Adicionar URLs selecionadas',
    'batch.discovery.searchUrls': 'Buscar URLs',
    'batch.discovery.selectAll': 'Selecionar todas',
    'batch.discovery.clearSelection': 'Limpar seleção',
    'batch.discovery.noLinksFound': 'Nenhum link encontrado',
    'batch.discovery.noUrlsSelected': 'Nenhuma URL selecionada',
    'batch.discovery.unsupportedUrl': 'URL não suportada',
    'batch.discovery.externalUrl': 'URL externa',
    'batch.discovery.duplicate': 'Duplicada',
    'batch.discovery.invalidUrl': 'URL inválida',
    'batch.discovery.excluded': 'Excluída',
    'batch.discovery.discovered': 'Descobertas',
    'batch.discovery.selected': 'Selecionadas',
    'batch.discovery.skipped': 'Ignoradas',
    'batch.discovery.scope': 'Escopo',
    'batch.discovery.filters': 'Filtros',
    'batch.discovery.cleaning': 'Limpeza',
    'batch.discovery.limit': 'Limite',
    'batch.discovery.sensitiveWarning':
      'Esta página pode conter conteúdo privado. Só descubra URLs aqui se você confia no contexto da página.',
    'batch.discovery.noActiveTab': 'Nenhuma aba ativa encontrada.',
    'batch.discovery.permissionError': 'Não foi possível ler links da aba ativa.',
    'batch.discovery.contentUnavailable':
      'Não foi possível conectar à aba ativa. Recarregue a página e tente novamente.',
    'batch.cancelled': 'Lote cancelado',
    'batch.browsingNote': 'Você pode continuar navegando em outras abas enquanto o lote roda.',
    'batch.keepTabOpen': 'Mantenha a aba de processamento aberta enquanto o lote estiver em execução.',
    'batch.recentEvents': 'Eventos recentes',
    'batch.successful': 'Sucesso',
    'batch.warningRuns': 'Alertas',
    'batch.failedRuns': 'Falhas',
    'batch.skippedRuns': 'Ignoradas',
    'batch.duration': 'Duração',
    'batch.created': 'Criado',
    'batch.completed': 'Concluído',
    'batch.noRecipesSelected': 'Selecione pelo menos uma receita.',
    'batch.noValidUrls': 'Adicione pelo menos uma URL válida.',
    'batch.noPlannedRuns': 'Nenhuma execução planejada.',
    'batch.resumeLater':
      'Você pode retomar este lote depois. O ExtractKit continuará a partir do próximo item pendente.',
    'batch.pausedCurrentItem': 'Pausado após o item atual. Você pode retomar depois.',
    'batch.alreadyActive': 'Já existe um lote em execução ou pausado.',
    'batch.activeStartBlocked': 'Finalize, retome ou pare esse lote antes de iniciar outro.',
    'batch.usedByActiveBatch': 'Usada por lote ativo',
    'batch.recipeLockedDescription':
      'Esta receita está sendo usada por um lote ativo. Pause ou pare o lote antes de editá-la.',
    'batch.settingsLocked': 'Algumas configurações ficam bloqueadas enquanto um lote está em execução.',
    'batch.activeRunDeleteBlocked': 'Esta execução pertence a um lote ativo e ainda não pode ser excluída.',
    'batch.activeBatchDeleteBlocked': 'Este lote está ativo e ainda não pode ser excluído.',
    'batch.batchBadge': 'Lote',
    'batch.deleteConfirm': 'Excluir este registro de lote? As execuções salvas serão mantidas.',
    'batch.status.draft': 'Rascunho',
    'batch.status.running': 'Lote em execução',
    'batch.status.paused': 'Lote pausado',
    'batch.status.completed': 'Lote concluído',
    'batch.status.cancelled': 'Lote cancelado',
    'batch.status.failed': 'Lote com falha',
    'batch.onUrlError.stop': 'Parar lote',
    'batch.onUrlError.skip': 'Pular URL',
    'batch.onUrlError.retryThenSkip': 'Tentar e depois pular',
    'batch.onRecipeError.stop': 'Parar lote',
    'batch.onRecipeError.skipRecipe': 'Pular receita',
    'batch.onRecipeError.continue': 'Continuar',
    'settings.title': 'Configurações',
    'settings.description': 'Personalize o ExtractKit para seu fluxo local.',
    'settings.appearance': 'Aparência',
    'settings.theme': 'Tema',
    'settings.themeHelp': 'Siga o tema do sistema ou force uma preferência local.',
    'settings.system': 'Sistema',
    'settings.light': 'Claro',
    'settings.dark': 'Escuro',
    'settings.language': 'Idioma',
    'settings.interfaceLanguage': 'Idioma da interface',
    'settings.localData': 'Dados locais',
    'settings.extractionDefaults': 'Padrões de extração',
    'settings.skipHttpErrorPagesDefault': 'Ignorar páginas com erro HTTP por padrão',
    'settings.skipHttpErrorPagesDefaultDescription':
      'Evite extrair páginas que parecem retornar erros HTTP como 404 ou 500 durante execuções em lote.',
    'settings.recipes': 'Receitas',
    'settings.savedRuns': 'Histórico salvo',
    'settings.exportAll': 'Exportar tudo',
    'settings.clearRuns': 'Limpar histórico',
    'settings.defaultRecipes': 'Receitas padrão',
    'settings.defaultRecipesDescription': 'Restaure receitas universais iniciais.',
    'settings.privacy': 'Privacidade',
    'settings.privacyDescription':
      'Receitas, preferências e execuções salvas ficam em chrome.storage.local neste navegador.',
    'settings.restoreDefaultRecipes': 'Restaurar receitas padrão',
    'settings.clearRunsConfirm': 'Limpar todo o histórico salvo? As receitas serão mantidas.',
    'settings.runsCleared': 'Histórico salvo limpo.',
    'settings.defaultsRestored': 'Receitas padrão restauradas.',
    'settings.exportEmpty': 'Não há histórico salvo para exportar.',
    'settings.english': 'English',
    'settings.portuguese': 'Português (Brasil)',
    'settings.processingViewport': 'Viewport de processamento',
    'settings.processingViewportDescription': 'Escolha o tamanho de viewport usado durante a extração em lote.',
    'settings.viewport.currentWindow': 'Usar tamanho da janela atual',
    'settings.viewport.desktop1366': 'Desktop 1366 × 768',
    'settings.viewport.desktop1440': 'Desktop 1440 × 900',
    'settings.viewport.desktop1920': 'Desktop 1920 × 1080',
    'settings.viewport.tablet768': 'Tablet 768 × 1024',
    'settings.viewport.mobile390': 'Mobile 390 × 844',
    'settings.viewport.custom': 'Personalizado',
    'settings.viewport.width': 'Largura',
    'settings.viewport.height': 'Altura',
    'settings.viewport.label': 'Viewport',
    'settings.viewport.notRecorded': 'Viewport não registrada',
    'settings.viewport.invalid': 'Tamanho de viewport inválido',
    'settings.viewport.newWindowHint': 'Uma janela separada do navegador será aberta para execuções em lote.',
    'common.all': 'Todas',
    'common.local': 'locais',
    'recipe.category.seo': 'SEO',
    'recipe.category.metadata': 'Metadados',
    'recipe.category.structured-data': 'Dados estruturados',
    'recipe.category.content': 'Conteúdo',
    'recipe.category.ecommerce': 'E-commerce',
    'recipe.category.links': 'Links',
    'recipe.category.images': 'Imagens',
    'recipe.category.social': 'Social',
    'recipe.category.qa': 'QA',
    'recipe.category.custom': 'Personalizada',
    'recipe.source.default': 'Padrão',
    'recipe.source.user': 'Usuário',
    'recipe.source.imported': 'Importada',
    'recipe.source.gallery': 'Galeria',
    'recipes.title': 'Receitas',
    'recipes.description': 'Biblioteca local de seletores e transformações.',
    'recipes.importing': 'Importando...',
    'recipes.import': 'Importar',
    'recipes.new': 'Nova Receita',
    'recipes.someNotImported': 'Alguns arquivos não foram importados.',
    'recipes.noneImported': 'Nenhuma receita foi importada.',
    'recipes.importedCount': 'receita(s) importada(s).',
    'recipes.emptyTitle': 'Nenhuma receita',
    'recipes.emptyDesc': 'Importe um arquivo .recipe.json ou crie uma receita local para começar.',
    'recipes.create': 'Criar receita',
    'recipes.noMatchTitle': 'Nenhuma receita encontrada',
    'recipes.noMatchDesc': 'Tente outro termo de busca ou categoria.',
    'recipes.noDesc': 'Sem descrição',
    'recipes.fields': 'campos',
    'recipes.patterns': 'padrões',
    'recipes.edit': 'Editar',
    'recipes.duplicate': 'Duplicar',
    'recipes.export': 'Exportar',
    'recipes.delete': 'Excluir',
    'recipes.deleteConfirm': 'Excluir a receita',
    'recipes.category': 'Categoria',
    'recipes.tags': 'Tags',
    'recipes.search': 'Buscar receitas...',
    'recipes.allWebsites': 'Todos os sites',
    'form.definition': 'Definição',
    'form.editRecipe': 'Editar receita',
    'form.newRecipe': 'Nova receita',
    'form.name': 'Nome',
    'form.namePlaceholder': 'Produto em ecommerce',
    'form.description': 'Descrição',
    'form.version': 'Versão',
    'form.urlPatterns': 'URLs compatíveis',
    'form.save': 'Salvar',
    'form.cancel': 'Cancelar',
    'form.nameRequired': 'Informe um nome para a receita.',
    'form.fieldsRequired': 'Adicione ao menos um campo.',
    'form.fieldsOrChecksRequired': 'Adicione ao menos um campo ou check.',
    'field.mode.single': 'Valor único',
    'field.mode.list': 'Lista simples',
    'field.mode.group': 'Lista de itens',
    'field.duplicate': 'Duplicar',
    'field.delete': 'Excluir',
    'field.jsonKey': 'Nome no JSON',
    'field.selector': 'Seletor CSS',
    'field.required': 'Obrigatório',
    'field.extract': 'Extrair',
    'field.attribute': 'Atributo',
    'field.transforms': 'Transformações',
    'field.itemFields': 'Campos do item',
    'field.add': 'Adicionar',
    'field.addField': 'Adicionar campo',
    'extract.text': 'Texto',
    'extract.html': 'HTML',
    'extract.attribute': 'Atributo',
    'extract.json': 'JSON',
    'extract.exists': 'Existe',
    'extract.count': 'Contagem',
    'extract.tagName': 'Nome da tag',
    'transform.trim': 'Remover bordas',
    'transform.removeExtraSpaces': 'Espaços extras',
    'transform.lowercase': 'Minúsculas',
    'transform.uppercase': 'Maiúsculas',
    'transform.number': 'Número',
    'transform.currency': 'Moeda',
    'transform.absoluteUrl': 'URL absoluta',
    'transform.jsonParse': 'Parse JSON',
    'data.title': 'Histórico',
    'data.description': 'Histórico local de execuções salvas.',
    'data.exportAll': 'Exportar tudo',
    'data.saved': 'salvas',
    'data.filters': 'Filtros',
    'data.recipe': 'Receita',
    'data.domain': 'Domínio',
    'data.url': 'URL',
    'data.filterUrl': 'Buscar URL',
    'data.select': 'Selecionar',
    'data.clear': 'Limpar',
    'data.exportSelected': 'Exportar selecionadas',
    'data.selectedLabel': 'selecionada(s)',
    'data.viewJson': 'Ver JSON',
    'data.viewDetails': 'Ver detalhes',
    'data.selectRun': 'Selecionar execução',
    'data.emptyTitle': 'Nenhuma execução salva',
    'data.emptyDesc': 'Execute e salve resultados em Execução para preencher este log.',
    'data.close': 'Fechar',
    'data.deleteConfirm': 'Excluir esta execução?',
    'toast.close': 'Fechar',
    'toast.recipeSaved': 'Receita salva.',
    'toast.recipeDeleted': 'Receita excluída.',
    'toast.recipeDuplicated': 'Receita duplicada.',
    'toast.exported': 'Exportação concluída.',
    'toast.exportFailed': 'Falha ao exportar.',
    'onboarding.welcomeTitle': 'Boas-vindas ao ExtractKit',
    'onboarding.welcomeSubtitle': 'Transforme páginas web em JSON estruturado com receitas reutilizáveis de extração.',
    'onboarding.welcomeHint1': 'Receitas definem o que extrair de uma página.',
    'onboarding.welcomeHint2': 'Execuções rodam receitas na aba ativa.',
    'onboarding.welcomeHint3': 'Os resultados ficam locais no seu navegador.',
    'onboarding.getStarted': 'Começar',
    'onboarding.skip': 'Pular configuração',
    'onboarding.starterTitle': 'Escolha receitas iniciais',
    'onboarding.starterSubtitle': 'Instale algumas receitas locais para começar a extrair dados imediatamente.',
    'onboarding.installSelected': 'Instalar receitas selecionadas',
    'onboarding.installRecommended': 'Instalar recomendadas',
    'onboarding.skipForNow': 'Pular por enquanto',
    'onboarding.back': 'Voltar',
    'settings.starterSetup': 'Configuração inicial',
    'settings.starterSetupDescription': 'Escolha ou restaure receitas iniciais para este navegador.',
    'settings.runSetupAgain': 'Rodar configuração novamente',
    'toast.starterInstalled': 'Receitas iniciais instaladas.',
    'toast.setupSkipped': 'Configuração pulada.'
  }
};

export function translate(locale: LocalePreference, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries[defaultLocale][key];
}

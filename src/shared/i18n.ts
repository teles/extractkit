import type { LocalePreference } from './types';

export const defaultLocale: LocalePreference = 'en-US';

export type TranslationKey =
  | 'nav.home'
  | 'nav.recipes'
  | 'nav.data'
  | 'nav.settings'
  | 'nav.more'
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
    'nav.data': 'Runs',
    'nav.settings': 'Settings',
    'nav.more': 'More',
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
    'settings.recipes': 'Recipes',
    'settings.savedRuns': 'Saved runs',
    'settings.exportAll': 'Export all',
    'settings.clearRuns': 'Clear runs',
    'settings.defaultRecipes': 'Default recipes',
    'settings.defaultRecipesDescription': 'Restore universal starter recipes.',
    'settings.privacy': 'Privacy',
    'settings.privacyDescription': 'Recipes, preferences and saved runs stay in chrome.storage.local on this browser.',
    'settings.restoreDefaultRecipes': 'Restore default recipes',
    'settings.clearRunsConfirm': 'Clear all saved runs? Recipes will be kept.',
    'settings.runsCleared': 'Saved runs cleared.',
    'settings.defaultsRestored': 'Default recipes restored.',
    'settings.exportEmpty': 'No saved runs to export.',
    'settings.english': 'English',
    'settings.portuguese': 'Português (Brasil)',
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
    'data.title': 'Runs',
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
    'data.emptyTitle': 'No runs',
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
    'nav.data': 'Execuções',
    'nav.settings': 'Configurações',
    'nav.more': 'Mais',
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
    'settings.recipes': 'Receitas',
    'settings.savedRuns': 'Execuções salvas',
    'settings.exportAll': 'Exportar tudo',
    'settings.clearRuns': 'Limpar execuções',
    'settings.defaultRecipes': 'Receitas padrão',
    'settings.defaultRecipesDescription': 'Restaure receitas universais iniciais.',
    'settings.privacy': 'Privacidade',
    'settings.privacyDescription':
      'Receitas, preferências e execuções salvas ficam em chrome.storage.local neste navegador.',
    'settings.restoreDefaultRecipes': 'Restaurar receitas padrão',
    'settings.clearRunsConfirm': 'Limpar todas as execuções salvas? As receitas serão mantidas.',
    'settings.runsCleared': 'Execuções salvas foram limpas.',
    'settings.defaultsRestored': 'Receitas padrão restauradas.',
    'settings.exportEmpty': 'Não há execuções salvas para exportar.',
    'settings.english': 'English',
    'settings.portuguese': 'Português (Brasil)',
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
    'data.title': 'Execuções',
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
    'data.emptyTitle': 'Nenhuma execução',
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

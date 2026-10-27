import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import {
  CampaignNavigation,
  PageOutline,
  RelatedNavigation,
} from "./quartz/components/SiteNavigation"

function registerSiteNavigation() {
  for (const [source, component] of [
    ["@quartz-community/explorer", CampaignNavigation],
    ["@quartz-community/table-of-contents", PageOutline],
    ["@quartz-community/backlinks", RelatedNavigation],
  ] as const) {
    componentRegistry.register(source, component, source)
    // Keep package aliases on the same component, including resource collection.
    for (const [name, registered] of componentRegistry.getAll()) {
      if (registered.source === source) {
        componentRegistry.register(name, component, source, registered.manifest)
      }
    }
  }
}

registerSiteNavigation()
const config = await loadQuartzConfig()
registerSiteNavigation()
export default config
export const layout = await loadQuartzLayout()

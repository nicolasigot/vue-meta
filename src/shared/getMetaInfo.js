import deepmerge from 'deepmerge'
import getComponentOption from './getComponentOption'

/**
 * Returns the correct meta info for the given component
 * (child components will overwrite parent meta info)
 *
 * @param  {Object} component - the Vue instance to get meta info from
 * @return {Object} - returned meta info
 */
export default function getMetaInfo (component) {
  // set some sane defaults
  const defaultInfo = {
    title: '',
    titleChunk: '',
    titleTemplate: '%s',
    htmlAttrs: {},
    bodyAttrs: {},
    meta: [],
    base: [],
    link: [],
    style: [],
    script: [],
    noscript: []
  }

  // collect & aggregate all metaInfo $options
  const info = getComponentOption({
    component,
    option: 'metaInfo',
    deep: true,
    arrayMerge (target, source) {
      // we concat the arrays without merging objects contained therein,
      // but we check for a `vmid` property on each object in the array
      // using an O(1) lookup associative array exploit
      // note the use of "for in" - we are looping through arrays here, not
      // plain objects
      const destination = []
      for (let targetIndex in target) {
        const targetItem = target[targetIndex]
        let shared = false
        for (let sourceIndex in source) {
          const sourceItem = source[sourceIndex]
          if (targetItem.vmid === sourceItem.vmid) {
            shared = true
            break
          }
        }
        if (!shared) {
          destination.push(targetItem)
        }
      }

      return destination.concat(source)
    }
  })

  // if any info options are a function, coerce them to the result of a call
  Object.keys(info).forEach((key) => {
    const val = info[key]
    info[key] = typeof val === 'function' && key !== 'changed' ? val() : val
  })

  // backup the title chunk in case user wants access to it
  if (info.title) {
    info.titleChunk = info.title
  }

  // replace title with populated template
  if (info.titleTemplate) {
    info.title = info.titleTemplate.replace(/%s/g, info.titleChunk)
  }

  // convert base tag to an array so it can be handled the same way
  // as the other tags
  if (info.base) {
    info.base = Object.keys(info.base).length ? [info.base] : []
  }

  return deepmerge(defaultInfo, info)
}

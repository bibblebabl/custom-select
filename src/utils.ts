export enum SelectActions {
  Close = 0,
  CloseSelect = 1,
  First = 2,
  Last = 3,
  Next = 4,
  Open = 5,
  PageDown = 6,
  PageUp = 7,
  Previous = 8,
  Select = 9,
  Type = 10,
}

/*
 * Helper functions
 */

// filter an array of options against an input string
// returns an array of options that begin with the filter string, case-independent
function filterOptions(options: string[] = [], filter, exclude = []) {
  return options.filter((option) => {
    const matches = option.toLowerCase().indexOf(filter.toLowerCase()) === 0
    return matches && exclude.indexOf(option) < 0
  })
}

// map a key press to an action
export function getActionFromKey(event: KeyboardEvent, menuOpen: boolean) {
  const { key, altKey, ctrlKey, metaKey } = event
  const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '] // all keys that will do the default open action
  // handle opening when closed
  if (!menuOpen && openKeys.includes(key)) {
    return SelectActions.Open
  }

  // home and end move the selected option when open or closed
  if (key === 'Home') {
    return SelectActions.First
  }
  if (key === 'End') {
    return SelectActions.Last
  }

  // handle typing characters when open or closed
  if (
    key === 'Backspace' ||
    key === 'Clear' ||
    (key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey)
  ) {
    return SelectActions.Type
  }

  // handle keys when open
  if (menuOpen) {
    if (key === 'ArrowUp' && altKey) {
      return SelectActions.CloseSelect
    } else if (key === 'ArrowDown' && !altKey) {
      return SelectActions.Next
    } else if (key === 'ArrowUp') {
      return SelectActions.Previous
    } else if (key === 'PageUp') {
      return SelectActions.PageUp
    } else if (key === 'PageDown') {
      return SelectActions.PageDown
    } else if (key === 'Escape') {
      return SelectActions.Close
    } else if (key === 'Enter' || key === ' ') {
      return SelectActions.CloseSelect
    }
  }
}

// return the index of an option from an array of options, based on a search string
// if the filter is multiple iterations of the same letter (e.g "aaa"), then cycle through first-letter matches
export function getIndexByLetter(options, filter, startIndex = 0) {
  const orderedOptions = [...options.slice(startIndex), ...options.slice(0, startIndex)]
  const firstMatch = filterOptions(orderedOptions, filter)[0]
  const allSameLetter = (array) => array.every((letter) => letter === array[0])

  // first check if there is an exact match for the typed string
  if (firstMatch) {
    return options.indexOf(firstMatch)
  }

  // if the same letter is being repeated, cycle through first-letter matches
  else if (allSameLetter(filter.split(''))) {
    const matches = filterOptions(orderedOptions, filter[0])
    return options.indexOf(matches[0])
  }

  // if no matches, return -1
  else {
    return -1
  }
}

// get an updated option index after performing an action
export function getUpdatedIndex(currentIndex, maxIndex, action) {
  const pageSize = 10 // used for pageup/pagedown

  switch (action) {
    case SelectActions.First:
      return 0
    case SelectActions.Last:
      return maxIndex
    case SelectActions.Previous:
      return Math.max(0, currentIndex - 1)
    case SelectActions.Next:
      return Math.min(maxIndex, currentIndex + 1)
    case SelectActions.PageUp:
      return Math.max(0, currentIndex - pageSize)
    case SelectActions.PageDown:
      return Math.min(maxIndex, currentIndex + pageSize)
    default:
      return currentIndex
  }
}

// check if element is visible in browser view port
export function isElementInView(element) {
  var bounding = element.getBoundingClientRect()

  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// check if an element is currently scrollable
export function isScrollable(element) {
  return element && element.clientHeight < element.scrollHeight
}

// ensure a given child element is within the parent's visible scroll area
// if the child is not visible, scroll the parent
export function maintainScrollVisibility(activeElement, scrollParent) {
  const { offsetHeight, offsetTop } = activeElement
  const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent

  const isAbove = offsetTop < scrollTop
  const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight

  if (isAbove) {
    scrollParent.scrollTo(0, offsetTop)
  } else if (isBelow) {
    scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight)
  }
}

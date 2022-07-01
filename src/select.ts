import { DEFAULT_OPTION } from './data'
import {
  SelectActions,
  getActionFromKey,
  getIndexByLetter,
  getUpdatedIndex,
  isElementInView,
  isScrollable,
  maintainScrollVisibility,
} from './utils'

export class Select {
  private element: HTMLElement
  private comboboxElement: HTMLElement
  private listboxElement: HTMLElement
  private id: string

  private options: string[]

  private activeIndex: number
  private open: boolean
  private searchString: string
  private searchTimeout: number | null
  private ignoreBlur: boolean

  constructor(
    elements: {
      element: HTMLElement
      comboboxElement: HTMLElement
      listboxElement: HTMLElement
    },
    selectOptions: string[] = []
  ) {
    this.element = elements.element
    this.comboboxElement = elements.comboboxElement
    this.listboxElement = elements.listboxElement
    this.id = this.comboboxElement?.id || 'combo'

    // data
    this.options = selectOptions

    // state
    this.activeIndex = 0
    this.open = false
    this.searchString = ''
    this.searchTimeout = null
    this.ignoreBlur = false

    // init
    if (this.element && this.comboboxElement && this.listboxElement) {
      this.init()
    }
  }

  init() {
    // select first option by default
    this.comboboxElement.innerHTML = DEFAULT_OPTION

    // add event listeners
    this.comboboxElement.addEventListener('blur', this.onComboBlur.bind(this))
    this.comboboxElement.addEventListener('click', this.onComboClick.bind(this))
    this.comboboxElement.addEventListener('keydown', this.onComboKeyDown.bind(this))

    // create options
    this.options.map((option, index) => {
      const optionEl = this.createOption(option, index)
      this.listboxElement.appendChild(optionEl)
    })
  }

  createOption(optionText: string, index: number) {
    const optionElelement = document.createElement('div')
    optionElelement.setAttribute('role', 'option')
    optionElelement.id = `${this.id}-${index}`
    optionElelement.className =
      index === 0
        ? `combo__option combo__option--${index} option-current`
        : `combo__option combo__option--${index}`
    optionElelement.setAttribute('aria-selected', `${index === 0}`)
    optionElelement.innerText = optionText

    optionElelement.addEventListener('click', (event) => {
      event.stopPropagation()
      this.onOptionClick(index)
    })
    optionElelement.addEventListener('mousedown', this.onOptionMouseDown.bind(this))

    return optionElelement
  }

  getSearchString(char: string) {
    // reset typing timeout and start new timeout
    // this allows us to make multiple-letter matches, like a native select
    if (typeof this.searchTimeout === 'number') {
      window.clearTimeout(this.searchTimeout)
    }

    this.searchTimeout = window.setTimeout(() => {
      this.searchString = ''
    }, 500)

    // add most recent letter to saved search string
    this.searchString += char
    return this.searchString
  }

  onComboBlur() {
    // do not do blur action if ignoreBlur flag has been set
    if (this.ignoreBlur) {
      this.ignoreBlur = false
      return
    }

    // select current option and close
    if (this.open) {
      this.selectOption(this.activeIndex)
      this.updateMenuState(false, false)
    }
  }

  onComboClick() {
    this.updateMenuState(!this.open, false)
  }

  onComboKeyDown(event: KeyboardEvent) {
    const { key } = event
    const max = this.options.length - 1

    const action = getActionFromKey(event, this.open)

    switch (action) {
      case SelectActions.Last:
      case SelectActions.First:
        this.updateMenuState(true)
      // intentional fallthrough
      case SelectActions.Next:
      case SelectActions.Previous:
      case SelectActions.PageUp:
      case SelectActions.PageDown:
        event.preventDefault()
        return this.onOptionChange(getUpdatedIndex(this.activeIndex, max, action))
      case SelectActions.CloseSelect:
        event.preventDefault()
        this.selectOption(this.activeIndex)
      // intentional fallthrough
      case SelectActions.Close:
        event.preventDefault()
        return this.updateMenuState(false)
      case SelectActions.Type:
        return this.onComboType(key)
      case SelectActions.Open:
        event.preventDefault()
        return this.updateMenuState(true)
    }
  }

  onComboType(letter: string) {
    // open the listbox if it is closed
    this.updateMenuState(true)

    // find the index of the first matching option
    const searchString = this.getSearchString(letter)
    const searchIndex = getIndexByLetter(this.options, searchString, this.activeIndex + 1)

    // if a match was found, go to it
    if (searchIndex >= 0) {
      this.onOptionChange(searchIndex)
    }
    // if no matches, clear the timeout and search string
    else {
      if (this.searchTimeout) {
        window.clearTimeout(this.searchTimeout)
      }
      this.searchString = ''
    }
  }

  onOptionChange(index: number) {
    // update state
    this.activeIndex = index

    // update aria-activedescendant
    this.comboboxElement.setAttribute('aria-activedescendant', `${this.id}-${index}`)

    // update active option styles
    const options = this.element.querySelectorAll('[role=option]')

    options.forEach((optionEl) => {
      optionEl.classList.remove('option-current')
    })

    options[index].classList.add('option-current')

    // ensure the new option is in view
    if (isScrollable(this.listboxElement)) {
      maintainScrollVisibility(options[index], this.listboxElement)
    }

    // ensure the new option is visible on screen
    // ensure the new option is in view
    if (!isElementInView(options[index])) {
      options[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  onOptionClick(index: number) {
    this.onOptionChange(index)
    this.selectOption(index)
    this.updateMenuState(false)
  }

  onOptionMouseDown() {
    // Clicking an option will cause a blur event,
    // but we don't want to perform the default keyboard blur action
    this.ignoreBlur = true
  }

  selectOption(index: number) {
    // update state
    this.activeIndex = index

    // update displayed value
    const selected = this.options[index]
    this.comboboxElement.innerHTML = selected

    // update aria-selected
    const options = this.element.querySelectorAll('[role=option]')

    Array.from(options).forEach((optionEl) => {
      optionEl.setAttribute('aria-selected', 'false')
    })

    options[index].setAttribute('aria-selected', 'true')
    this.comboboxElement.setAttribute('data-selected', index.toString())
  }

  updateMenuState(open: boolean, callFocus = true) {
    if (this.open === open) {
      return
    }

    // update state
    this.open = open

    // update aria-expanded and styles
    this.comboboxElement.setAttribute('aria-expanded', `${open}`)
    open ? this.element.classList.add('open') : this.element.classList.remove('open')

    // update activedescendant
    const activeID = open ? `${this.id}-${this.activeIndex}` : ''
    this.comboboxElement.setAttribute('aria-activedescendant', activeID)

    if (activeID === '' && !isElementInView(this.comboboxElement)) {
      this.comboboxElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    // move focus back to the combobox, if needed
    callFocus && this.comboboxElement.focus()
  }
}

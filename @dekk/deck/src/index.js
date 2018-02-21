import React, {Component, Children, cloneElement} from 'react'
import PropTypes from 'prop-types'
import {observer} from 'mobx-react'
import {range} from '@dekk/utils'
import Store from '@dekk/store'
import Slide from '@dekk/slide'
import Wrapper from './wrapper'

export const Plugins = () => null
Plugins.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ])
}
/**
 * A wrapper around the slides. It includes a paging component to allow
 * navigating the slides and fragments.
 *
 * `<Deck/>` renders 3 slides (previous, current, next) to allow various
 * transitions.
 *
 * The internal store is handled by mobX. {@link https://github.com/mobxjs/}
 *
 * @class Deck
 * @reactProps {Object} props
 *   The properties
 * @reactProps {(Slide|Slide[])} props.children
 * @reactProps {?String} props.mixin
 * @reactProps {?Boolean} props.slave
 *
 * @example
 * import React from 'react'
 * import Deck from '@dekk/deck'
 * import Slide from '@dekk/slide'
 *
 * const appStyles = `
 *  background: #000;
 *  color: #fff;
 * `
 * const App = ({slave}) => (
 *   <Dekk mixin={appStyles}>
 *     <Slide>1</Slide>
 *     <Slide>2</Slide>
 *     <Slide>3</Slide>
 *   </Dekk>
 * )
 */
@observer
export default class Deck extends Component {
  /**
   * Store.
   * It handles paging and fragment navigation
   * @private
   */
  store = new Store({
    page: 0,
    fragmentHosts: []
  })

  /**
   * @private
   * @return {{children: (Slide|Slide[]), mixin: ?String, slave: ?Boolean}}
   *   Allowed propTypes for `<Deck/>`
   */
  static get propTypes() {
    return {
      children: PropTypes.node.isRequired,
      mixin: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
    }
  }

  /**
   * Sends context to decendants.
   * Includes the app store to allow all deck components to access the store
   * without having to include its own logic.
   * @private
   * @return {{store: Object, fragmentHost: number}}
   *   The `store` and the `fragmentHost`
   */
  static get childContextTypes() {
    return {
      store: PropTypes.object.isRequired,
      fragmentHost: PropTypes.number
    }
  }

  /**
   * Constructor
   * @public
   * @param {Object} props
   *   The properties
   * @param {(Slide|Slide[]|Plugins|Plugins[])} props.children
   * @param {?String} props.mixin
   * @param {?Boolean} props.slave
   */
  constructor(props) {
    super(props)
  }

  /**
   * @private
   * @return {{store: store}}
   *   The child context.
   */
  getChildContext() {
    return {
      store: this.store
    }
  }
  get plugins() {
    const {
      page: slideIndex,
      fragmentCount: fragmentIndex,
      frgment: fragmentOrder
    } = this.store
    const {length: slideCount} = this.slides
    const pluginContainers = Children.toArray(this.props.children).filter(
      child => child.type === Plugins
    )
    const plugins = pluginContainers.reduce(
      (a, b) => a.concat(b.props.children),
      []
    )
    this.store.fragmentHosts[slideIndex] =
      this.store.fragmentHosts[slideIndex] || []
    const fragmentCount = this.store.fragmentHosts[slideIndex].length

    return plugins.map((plugin, index) =>
      cloneElement(plugin, {
        key: `${plugin.type.name}_${index}`,
        slideIndex,
        slideCount,
        fragmentIndex,
        fragmentCount,
        fragmentOrder
      })
    )
  }
  get slides() {
    return Children.toArray(this.props.children).filter(
      child => child.type !== Plugins
    )
  }
  /**
   * Get the `children` by a range of `+-1` around the current slide.
   * It renders a maximum of 3 slides (previous, current, next)
   * This allows various transitions between slides.
   *
   * @private
   * @return {Array<Slide>} returns an array of max 3 slides
   */
  get visibleSlides() {
    const {children} = this.props
    const {page, direction, fragment, fragmentHosts} = this.store
    this.slides.forEach((child, index) => {
      this.store.fragmentHosts[index] = this.store.fragmentHosts[index] || []
    })
    return (
      this.slides
        // Assign the original index for the Component
        .map((child, originalIndex) => ({child, originalIndex}))
        // Filter by a range of `+-1`
        // Filter first to reduce the number of clones
        .filter((c, i) => range(i, page + 1, page - 1))
        // Modify the remaining slides (maximum of 3)
        .map(({child, originalIndex}) => {
          const {length = 0} = this.store.fragmentHosts[originalIndex]
          const current = page === originalIndex
          const previous = page === originalIndex + 1
          const next = page === originalIndex - 1

          // Clone the element to add the logic
          return cloneElement(child, {
            key: `slide_${originalIndex}`,
            fragmentIndex: current ? fragment : previous ? length : 0,
            pageIndex: originalIndex,
            current,
            previous,
            next,
            fromPrevious: current && direction === -1,
            fromNext: current && direction === 1,
            toPrevious: previous && direction === 1,
            toNext: next && direction === -1,
            direction: direction
          })
        })
    )
  }

  /**
   * @private
   * @return {Wrapper}
   *   The entire Deck including paging logic inside a Wrapper
   */
  render() {
    return (
      <Wrapper mixin={this.props.mixin}>
        {this.plugins}
        {this.visibleSlides}
      </Wrapper>
    )
  }
}

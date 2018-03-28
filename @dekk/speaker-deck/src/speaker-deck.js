/* global window */
import React, {cloneElement} from 'react'
import PropTypes from 'prop-types'
import {css} from 'styled-components'
import {observer} from 'mobx-react'
import Slide from '@dekk/slide'
import {search} from '@dekk/url'
import {range} from '@dekk/utils'
import Timer, {renderCountdown} from '@dekk/countdown'
import Deck, {Wrapper} from '@dekk/deck'

import SpeakerWrapper from './speaker-wrapper'
import Controls, {
  PageNumber,
  FragmentNumber,
  ControlA,
  ControlB,
  LayoutToggle,
  ThemeToggle,
  PlayButton,
  Countdown,
  Label
} from './controls'

import View, {Preload, Preview, Iframe} from './views'

import NoteProvider, {Notes} from './notes'
import layouts from './layouts'

/**
 * Styles for the speaker-dek.
 * handles dark and light theme.
 * @private
 */
const presenterStyles = css`
  background: ${({theme}) => (theme === 'dark' ? '#111' : '#eee')};
  color: ${({theme}) => (theme === 'dark' ? '#fff' : '#000')};
`

/**
 * Displays ` n / m` strings.
 *
 * @private
 * @param {number} n
 * @param {Array} arr
 * @param {number} arr.length
 * @return {String}
 */
const nOf = (n, {length}) =>
  `${n + (length > 0 ? 1 : 0)} / ${Math.max(0, length)}`

/**
 * A wrapper around the slides.
 * `<SpeakerDeck/>` displays the slides in various layouts
 *
 *
 * @class SpeakerDeck
 * @param {Object} props
 *   The properties
 * @param {(Slide|Slide[]|Elements|Elements[]|Plugins|Plugins[])} props.children
 * @param {?(String|Array)} props.mixin
 * @param {number} props.timer
 * @param {number} [props.timerWarning=0]
 *
 * @example
 * import React from 'react'
 * import {SpeakerDeck} from '@dekk/deck'
 * import Slide from '@dekk/slide'
 *
 * const App = () => (
 *   <SpeakerDeck>
 *     <Slide>1</Slide>
 *     <Slide>2</Slide>
 *     <Slide>3</Slide>
 *   </SpeakerDeck>
 * )
 */
@observer
export default class SpeakerDeck extends Deck {
  /**
   * @private
   */
  static get propTypes() {
    return {
      mixin: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
      children: PropTypes.node.isRequired,
      timer: PropTypes.number,
      timerWarning: PropTypes.number
    }
  }

  /**
   * @private
   */
  static get defaultProps() {
    return {
      timer: 30,
      timerWarning: 0,
      mixin: ''
    }
  }

  /**
   * @param {Object} props
   *   The properties
   * @param {(Slide|Slide[]|Elements|Elements[]|Plugins|Plugins[])} props.children
   * @param {?(String|Array)} props.mixin
   * @param {number} props.timer
   * @param {number} [props.timerWarning=0]
   *
   */
  constructor(props) {
    super(props)

    /**
     * Data from url
     * @private
     */
    const {layout = 0, theme = 'light', playing} = search.parse(
      window.location.href
    )

    /**
     * @private
     * @property {number} layout
     * @property {String} theme
     * @property {Boolean} isPlaying
     */
    this.state = {layout, theme, isPlaying: playing === 'true'}

    this.switchLayout = this.switchLayout.bind(this)
    this.switchTheme = this.switchTheme.bind(this)
    this.togglePlaying = this.togglePlaying.bind(this)
  }

  /**
   * Switches the layout
   * @private
   */
  switchLayout() {
    this.setState(prevState => {
      const layout = (prevState.layout + 1) % layouts.length
      search.write({layout})
      return {layout}
    })
  }

  /**
   * Switches the theme
   * @private
   */
  switchTheme() {
    this.setState(prevState => {
      const theme = prevState.theme === 'dark' ? 'light' : 'dark'
      search.write({theme})
      return {theme}
    })
  }

  /**
   * Toggles play/pause of the timer
   * @private
   */
  togglePlaying() {
    this.setState(prevState => {
      const isPlaying = !prevState.isPlaying
      search.write({playing: isPlaying})
      return {isPlaying}
    })
  }

  /**
   * A button for the layout toggle
   * @private
   */
  get layoutToggle() {
    return (
      <LayoutToggle
        key="LayoutToggle"
        onClick={this.switchLayout}
        theme={this.state.theme}
      />
    )
  }

  /**
   * A button for the theme toggle
   * @private
   */
  get themeToggle() {
    return (
      <ThemeToggle
        key="ThemeToggle"
        onClick={this.switchTheme}
        theme={this.state.theme}
        isDark={this.state.theme === 'dark'}
      />
    )
  }

  /**
   * A button for the countdown timer
   * @private
   */
  get playButton() {
    return (
      <PlayButton
        key="PlayButton"
        onClick={this.togglePlaying}
        theme={this.state.theme}
        isPlaying={this.state.isPlaying}
      />
    )
  }

  /**
   * A collection of toggles
   * @private
   */
  get toggles() {
    return [this.playButton, this.themeToggle, this.layoutToggle]
  }

  get speakerSlides() {
    const {slideIndex, fragmentOrder, fragmentIndex} = this.store

    // Get the current fragmentHost
    // and create a boolean flag to check for fragments
    const fragmentHost = this.store.fragmentHosts[slideIndex]
    const hasFragments = fragmentHost.length - fragmentIndex > 1

    // We need a maximum of 2 slides `[current, next]`
    const filteredSlides = this.slides.filter((c, i) =>
      range(i, slideIndex + 1, slideIndex)
    )

    const [currentSlide, nextSlide = <Slide>end</Slide>] = filteredSlides

    const currentView = cloneElement(currentSlide, {
      fragmentOrder,
      slideIndex,
      direction: 0,
      present: true,
      isCurrent: true,
      key: 'currentView'
    })

    // The "pre-view" is either the current slide or the next slide
    // depending on the fragemnt flag
    const preView = hasFragments ? currentSlide : nextSlide
    const nextView = cloneElement(preView, {
      direction: 0,
      present: true,
      isNext: true,
      slideIndex: hasFragments ? slideIndex : slideIndex + 1,
      fragmentOrder: hasFragments ? fragmentHost[fragmentIndex + 1] : 0,
      key: 'nextView'
    })

    // Only return 2 slides
    return [currentView, nextView]
  }

  /**
   * @private
   * @return {Wrapper}
   *   The entire Deck inside a Wrapper
   */
  render() {
    const mixin = css`
      ${this.props.mixin};
      ${presenterStyles};
    `
    const slideNof = nOf(this.store.slideIndex, this.slides)
    const fragmentNof = nOf(
      this.store.fragmentIndex,
      this.store.fragmentHosts[this.store.slideIndex]
    )
    const countdown = {
      isRunning: this.state.isPlaying,
      end: this.props.timer,
      timerWarning: this.props.timerWarning || 0,
      render: renderCountdown
    }
    const currentSrc = `${window.location.origin}${
      window.location.pathname
    }?preview=0`
    const previewSrc = `${window.location.origin}${
      window.location.pathname
    }?preview=1`
    return (
      <Wrapper mixin={mixin} theme={this.state.theme}>
        {this.plugins}
        {this.elements}
        <Preload>{this.speakerSlides}</Preload>
        <SpeakerWrapper layout={this.state.layout}>
          <Controls layout={this.state.layout}>
            {this.toggles}
            <PageNumber theme={this.state.theme}>
              <Label>Slide</Label>
              {slideNof}
            </PageNumber>
            <FragmentNumber theme={this.state.theme}>
              <Label>Fragment</Label>
              {fragmentNof}
            </FragmentNumber>
            <ControlA />
            <ControlB>
              <Label>Time remaining</Label>
              <Countdown>
                <Timer {...countdown} />
              </Countdown>
            </ControlB>
          </Controls>
          <View>
            <Iframe
              src={currentSrc}
              height="100%"
              width="100%"
              frameborder="0"
            />
          </View>
          <Preview>
            <Iframe
              src={previewSrc}
              height="100%"
              width="100%"
              frameborder="0"
            />
          </Preview>
          <Notes>
            <NoteProvider>
              {this.store.notes[this.store.slideIndex]}
            </NoteProvider>
          </Notes>
        </SpeakerWrapper>
      </Wrapper>
    )
  }
}

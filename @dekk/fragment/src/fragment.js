import PropTypes from 'prop-types'
import styled from 'styled-components'

/**
 * Styled version of the Fragment component
 * @private
 * @type {StyledComponent}
 * @reactProps {Object} props
 *   The properties
 * @reactProps {(ReactNode|ReactNode[])} children
 * @reactProps {?Boolean} active
 * @reactProps {?string} animation
 */
const StyledFragment = styled.span`
  --direction: 1;
  ${({mixin}) => mixin || ''};
  display: ${({displayAs}) => displayAs || 'inline-block'};
  ${({isFit}) =>
    isFit
      ? `
    display: flex;
    height: 100%;
    width: 100%;
    flex: 1;
  `
      : ''};
  ${props =>
    props.animation ||
    `
      visibility: ${props.isActive ? 'visible' : 'hidden'}
  `};
`

/**
 * @private
 * @type {String}
 */
StyledFragment.displayName = 'StyledFragment'

/**
 * @private
 * @type {Object}
 * @prop {(ReactNode|ReactNode[])} children
 * @prop {?Boolean} isActive
 * @prop {?(String|Array)} animation
 */
StyledFragment.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  isFit: PropTypes.bool,
  isActive: PropTypes.bool,
  mixin: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  animation: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
}

export default StyledFragment

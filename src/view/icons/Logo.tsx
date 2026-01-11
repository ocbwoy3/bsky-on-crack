import React from 'react'
import {type TextProps} from 'react-native'
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  type PathProps,
  Stop,
  type SvgProps,
} from 'react-native-svg'
import {Image} from 'expo-image'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {flatten} from '#/alf'

const ratio = 57 / 64
const defaultFill = '#1FA855'

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = React.forwardRef(function LogoImpl(props: Props, ref) {
  const {fill, ...rest} = props
  const gradient = fill === 'sky'
  const styles = flatten(props.style)
  const _fill = gradient ? 'url(#sky)' : fill || styles?.color || defaultFill
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  const isKawaii = useKawaiiMode()

  if (isKawaii) {
    return (
      <Image
        source={
          size > 100
            ? require('../../../assets/kawaii.png')
            : require('../../../assets/kawaii_smol.png')
        }
        accessibilityLabel="Bluesky On Crack"
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        style={[{height: size, aspectRatio: 1.4}]}
      />
    )
  }

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 64 57"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      {gradient && (
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B9A5B" stopOpacity="1" />
            <Stop offset="1" stopColor="#62D68F" stopOpacity="1" />
          </LinearGradient>
        </Defs>
      )}

      <Path
        fill={_fill}
        d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
      />
      <G transform="translate(-3, 0)">
        <Path d="M38 27.8l22 8.4-3.2 8.4-22-8.4z" fill="#F5F5F5" />
        <Path d="M58.4 35.6l7.2 2.8-3.2 8.4-7.2-2.8z" fill="#E97C2A" />
        <Circle cx="37.6" cy="31.5" r="1.4" fill="#C6C6C6" />
        <Path
          d="M57 25c3.8-3.2 2.8-6.6-.8-8.8M61.2 30.8c3.6-2.8 3.6-6.4 1.4-8.6"
          fill="none"
          stroke="#7B7B7B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M52.8 22.2c2.6-2.2 2-4.6-.6-6.2"
          fill="none"
          stroke="#9A9A9A"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path
          d="M64 34.4c2.6-1.8 2.8-4.8 1-6.6"
          fill="none"
          stroke="#8A8A8A"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
})

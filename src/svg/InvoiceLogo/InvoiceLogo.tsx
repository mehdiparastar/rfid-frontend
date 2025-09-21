import { SvgIcon, type SvgIconProps } from '@mui/material';
import INVOICELOGOSVG from './invoiceLogo.svg?react'
import { keyframes } from '@mui/system'

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`

export const InvoiceLogo: React.FC<SvgIconProps> = (props) => {
    const { sx, ...rest } = props
    return (
        <SvgIcon
            component={INVOICELOGOSVG}
            inheritViewBox
            sx={{
                // make CSS transforms work on the SVG group
                '& #dots-ring': {
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `${spin} 24s linear infinite`,
                },
                ...sx
            }}
            {...rest}
        />
    );
};
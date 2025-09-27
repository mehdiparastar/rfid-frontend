import { Box, SvgIcon, type SvgIconProps } from '@mui/material';
import INVOICELOGOSVG from './invoiceLogo.svg?react';
import invoiceLogoUrl from './invoiceLogo.svg?url';


export const InvoiceLogo: React.FC<SvgIconProps> = (props) => {
    const { sx, ...rest } = props
    return (
        <SvgIcon
            component={INVOICELOGOSVG}
            inheritViewBox
            sx={{
                ...sx
            }}
            {...rest}
        />
    );
};

export function InvoiceLogoImg(props: React.ComponentProps<'img'>) {
    return <Box component="img" src={invoiceLogoUrl} alt="Invoice logo" {...props} />;
}
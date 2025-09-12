import { SvgIcon, type SvgIconProps } from '@mui/material';
import RFIDISVG from './rfid.svg?react'

export const RFIDIcon: React.FC<SvgIconProps> = (props) => {
    return (
        <SvgIcon
            component={RFIDISVG}
            {...props}
        />
    );
};
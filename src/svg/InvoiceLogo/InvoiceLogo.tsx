import { SvgIcon, type SvgIconProps } from '@mui/material';


export const InvoiceLogo: React.FC<SvgIconProps> = (props) => {
    return (
        <SvgIcon
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="215"
                height="340"
                viewBox="0 0 215 340"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M 157 0 L 58 168 L 25 110 L 0 107 L 0 234 L 24 234 L 58 172 L 155 339 L 214 339 L 119 172 L 214 4 Z"
                />
            </svg>
        </SvgIcon>
    );
};


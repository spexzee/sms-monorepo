import { styled, Tooltip, tooltipClasses } from "@mui/material";
import type { TooltipProps } from "@mui/material";

/**
 * Custom HTML Tooltip with white background and black text
 */
const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#ffffff",
        color: "#000000",
        maxWidth: 300,
        fontSize: theme.typography.pxToRem(13),
        border: "1px solid #dadde9",
        boxShadow: theme.shadows[3],
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(1.5),
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: "#ffffff",
        "&::before": {
            border: "1px solid #dadde9",
        },
    },
}));

export default HtmlTooltip;

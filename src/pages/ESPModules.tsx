import { useTheme } from "@mui/material"
import { translate } from "../utils/translate"
import { useEspModules } from "../api/espModules"

export default function ESPModules() {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!

    const { data, isLoading } = useEspModules()
    return (
        <>
            {JSON.stringify(data)}
        </>
    )
}
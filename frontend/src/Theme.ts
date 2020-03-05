import { createMuiTheme, responsiveFontSizes } from "@material-ui/core/styles";
import { green, amber, lightBlue } from "@material-ui/core/colors";

let theme = createMuiTheme({
  palette: {
    primary: amber,
    secondary: lightBlue,
  },
});
theme = responsiveFontSizes(theme);

export default theme;

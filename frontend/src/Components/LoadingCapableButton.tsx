import React from "react";
import Button, { ButtonProps } from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
type LoadingButtonProps = {
  loading: boolean;
} & ButtonProps;
const SpinnerAdornment = () => <CircularProgress color="primary" style={{ marginLeft: 5 }} size={20} />;
export const LoadingButton = (props: LoadingButtonProps) => {
  const { children, loading, ...rest } = props;
  return (
    <Button {...rest}>
      {children}
      {loading && <SpinnerAdornment {...rest} />}
    </Button>
  );
};

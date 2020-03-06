import React from "react";
import Button, { ButtonProps } from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { IconButton, IconButtonProps } from "@material-ui/core";
type LoadingButtonProps = {
  loading: boolean;
} & ButtonProps;
const SpinnerAdornment = () => <CircularProgress color="primary" style={{ marginLeft: 5 }} size={20} />;
export const LoadingButton = (props: LoadingButtonProps) => {
  const { children, loading, ...rest } = props;
  return (
    <Button disabled={loading} {...rest}>
      {children}
      {loading && <SpinnerAdornment {...rest} />}
    </Button>
  );
};

type LoadingIconButtonProps = {
  loading: boolean;
} & IconButtonProps;
const IconSpinnerAdornment = () => <CircularProgress color="primary" size={25} />;

export const LoadingIconButton = (props: LoadingIconButtonProps) => {
  const { children, loading, ...rest } = props;
  return (
    <IconButton disabled={loading} {...rest}>
      {!loading && children}
      {loading && <IconSpinnerAdornment {...rest} />}
    </IconButton>
  );
};

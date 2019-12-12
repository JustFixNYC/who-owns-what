// Since react-social doesn't have any pre-existing typings, we're providing
// our own, but only based on our own use case; these options are also inferred
// based on looking at our use of the API so they might be inaccurate!
module "react-social" {
  type BaseProps = {
    onClick: () => void,
    className: string,
    url: string,
    windowOptions?: string[],
    message?: string,
  };

  const FacebookButton: React.FC<{appId: string, sharer: boolean} & BaseProps>;
  const TwitterButton: React.FC<BaseProps>;
  const EmailButton: React.FC<{target: string} & BaseProps>;
}

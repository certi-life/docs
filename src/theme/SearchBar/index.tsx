import React, {useEffect} from 'react';
import {useLocation} from '@docusaurus/router';
import OriginalSearchBar from '@theme-original/SearchBar';

type Props = React.ComponentProps<typeof OriginalSearchBar>;

export default function SearchBar(props: Props): React.JSX.Element {
  const location = useLocation();

  useEffect(() => {
    document
      .querySelectorAll<HTMLInputElement>('.navbar__search-input, input[type="search"][name="q"]')
      .forEach((input) => input.setAttribute('aria-label', '문서 검색'));
  }, [location.pathname]);

  return <OriginalSearchBar {...props} />;
}

import React, {useEffect} from 'react';
import Head from '@docusaurus/Head';
import OriginalSearchPage from '@theme-original/SearchPage';

type Props = React.ComponentProps<typeof OriginalSearchPage>;

export default function SearchPage(props: Props): React.JSX.Element {
  useEffect(() => {
    const searchPage = document
      .querySelector<HTMLInputElement>('input[type="search"][name="q"]')
      ?.closest<HTMLElement>('.container');

    searchPage?.setAttribute('role', 'main');
    return () => searchPage?.removeAttribute('role');
  }, []);

  return (
    <>
      <Head>
        <meta name="description" content="CertiLife 사용 가이드 전체에서 기능, 문제 상황, 해결 방법을 검색하세요." />
      </Head>
      <OriginalSearchPage {...props} />
    </>
  );
}

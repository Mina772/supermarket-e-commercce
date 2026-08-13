import { useParams } from 'react-router-dom';
import { ProductDetail } from '@/components/product/product-detail';
export default function ProductPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  return <ProductDetail slug={slug ?? ''} />;
}

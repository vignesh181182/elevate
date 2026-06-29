import { useNavigate } from 'react-router-dom';
import PageStub from '../components/PageStub';

export default function ClientNew() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Back">
          ‹
        </button>
      </div>
      <PageStub title="Add client" note="Staged add-client flow — milestone 4." />
    </div>
  );
}

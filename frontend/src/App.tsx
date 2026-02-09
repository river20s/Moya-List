import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import QuestionListPage from './pages/QuestionListPage';
import TagListPage from './pages/TagListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<QuestionListPage />} />
          <Route path="tags" element={<TagListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";

function App() {
  const [students, setStudents] = useState([]);

  const fetchStudents = () => {
    fetch("http://localhost:5000/students")
      .then((res) => res.json())
      .then((data) => setStudents(data || [])) 
      .catch((err) => console.error("Fetch error:", err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (student) => {
    await fetch("http://localhost:5000/add-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
    fetchStudents();
  };

  const handleDelete = async (roll) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await fetch(`http://localhost:5000/delete-student?roll=${roll}`, {
        method: "DELETE",
      });
      fetchStudents();
    }
  };

  const handleEdit = async (student) => {
    await fetch("http://localhost:5000/update-student", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
    fetchStudents();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Kindergarten School Registry</h1>
      <StudentForm onAddStudent={addStudent} />
      <StudentList students={students} onDelete={handleDelete} onEdit={handleEdit} />
    </div>
  );
}

export default App;

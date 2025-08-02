import api from "./api.js";

const getPersons = async () => {
  try {
    const response = await api.get("/person/show");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPersonById = async (id) => {
  try {
    const response = await api.get(`/person/show/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createPerson = async (personData) => {
  try {
    const response = await api.post("/person/create", personData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updatePerson = async (id, personData) => {
  try {
    const response = await api.put(`/person/update/${id}`, personData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deletePerson = async (id) => {
  try {
    const response = await api.delete(`/person/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getPersons, getPersonById, createPerson, updatePerson, deletePerson };

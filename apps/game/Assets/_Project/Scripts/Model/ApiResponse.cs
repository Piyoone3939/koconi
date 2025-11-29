using System;

namespace Koconi.Model
{
    [Serializable]
    public class ApiResponse<T>
    {
        public bool success;
        public string message;
        public T data;
    }
}

import React from "react"
import { useSearchBox } from "react-instantsearch"

import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchBox({ onFocus, handleClose }) {
  const { refine, query } = useSearchBox()

  const handleChange = (e) => {
    refine(e.target.value)
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <TextField
        fullWidth
        autoFocus
        variant="outlined"
        autoComplete="off"
        type="text"
        placeholder="Search Posts"
        aria-label="Search"
        onChange={handleChange}
        value={query}
        onFocus={onFocus}
        InputProps={{
          style: { fontSize: 16 },
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <Button
              variant="outlined"
              onClick={handleClose}
              color="primary"
              size="small"
              sx={{
                py: 0,
                minWidth: 0,
                fontSize: "14px",
                fontWeight: "400",
                textTransform: "none",
                color: "text.secondary",
                borderColor: "divider",
              }}
            >
              esc
            </Button>
          ),
        }}
        sx={{
          "& fieldset": { border: "none" },
        }}
      />
    </form>
  )
}